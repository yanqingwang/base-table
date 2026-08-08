// utils/syncManager.js - 数据同步（智能分层合并：计数器取大值 + 字段级取最新 + 冲突标记）
const storage = require('./storage');

// 配额的可编辑字段（用于字段级 LWW 比较）
const QUOTA_FIELDS = ['merchant', 'item', 'amount', 'totalTimes', 'usedTimes', 'expireDate', 'expire_date', 'note', 'preferences'];

class SyncManager {
  constructor() {
    this.isSyncing = false;
  }

  /**
   * 从云端拉取并合并到本地
   */
  async pull(app) {
    if (this.isSyncing) return false;
    this.isSyncing = true;
    try {
      const [quotas, checkins, ratings] = await Promise.all([
        app.callApi('/api/quotas', 'GET'),
        app.callApi('/api/checkins', 'GET'),
        app.callApi('/api/ratings', 'GET'),
      ]);
      // 记录级比对：同步前生成差异报告
      const diffReport = this.diffLocalCloud(quotas || [], checkins || [], ratings || []);
      this.merge(quotas || [], checkins || [], ratings || []);
      const conflicts = diffReport.filter(d => d.direction === 'conflict');
      storage.setSyncStatus({
        lastSyncTime: Date.now(),
        hasPendingSync: diffReport.some(d => d.direction !== 'cloud_to_local'),
        lastDiff: {
          total: diffReport.length,
          localOnly: diffReport.filter(d => d.type === 'local_only').length,
          cloudOnly: diffReport.filter(d => d.type === 'cloud_only').length,
          fieldDiffs: diffReport.filter(d => d.type === 'field_diff').length,
          conflicts: conflicts.length,
          items: diffReport.slice(0, 20),
        },
      });
      return true;
    } catch (e) {
      console.error('同步失败:', e);
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // 读取字段，兼容后端下划线 / 前端驼峰
  getField(obj, name) {
    if (!obj) return undefined;
    const camel = name === 'expire_date' ? 'expireDate' : name === 'total_times' ? 'totalTimes' : name === 'used_times' ? 'usedTimes' : name;
    return obj[name] !== undefined ? obj[name] : obj[camel];
  }

  setField(obj, name, value) {
    const camel = name === 'expire_date' ? 'expireDate' : name === 'total_times' ? 'totalTimes' : name === 'used_times' ? 'usedTimes' : name;
    obj[name] = value;
    obj[camel] = value;
  }

  /**
   * 智能合并配额：
   * - usedTimes 取最大值（防止离线扣减丢失）
   * - 其余字段逐字段比较 updatedAt，取各自最新
   * - 同字段双改（时间戳相同且值不同）→ 标记 conflict
   */
  mergeQuota(local, cloud) {
    const localTs = local.updatedAt || local.updated_at || 0;
    const cloudTs = cloud.updatedAt || cloud.updated_at || 0;
    const merged = { ...local };

    // 1. usedTimes 取最大值（计数不丢失）
    const lu = this.getField(local, 'used_times') || 0;
    const cu = this.getField(cloud, 'used_times') || 0;
    if (cu > lu) {
      this.setField(merged, 'used_times', cu);
    }

    // 2. 其余字段逐字段 LWW
    const conflicts = [];
    for (const f of QUOTA_FIELDS) {
      if (f === 'used_times') continue; // 已特殊处理
      const lv = this.getField(local, f);
      const cv = this.getField(cloud, f);
      if (lv === undefined || JSON.stringify(lv) === JSON.stringify(cv)) continue;
      if (cv === undefined) continue;
      if (cloudTs > localTs) {
        this.setField(merged, f, cv);
      } else if (cloudTs === localTs) {
        // 同时间戳但值不同 → 冲突
        conflicts.push(f);
        // 默认取云端（合并结果可编辑），标记待用户确认
        this.setField(merged, f, cv);
      }
      // cloudTs < localTs: 本地较新，保留本地值
    }

    if (conflicts.length > 0) {
      merged.conflict = true;
      merged.conflictFields = (merged.conflictFields || []).concat(conflicts);
    }

    // 更新时间戳取最大值
    merged.updatedAt = Math.max(localTs, cloudTs) || Date.now();
    merged.updated_at = merged.updatedAt;
    return merged;
  }

  /**
   * 记录级比对：逐条比较本地与云端差异，返回差异报告
   * @returns {Array<{type: string, key: string, field: string, local: any, cloud: any, direction: string}>}
   *   type: 'local_only' | 'cloud_only' | 'field_diff'
   *   direction: 'local_to_cloud' | 'cloud_to_local' | 'conflict'
   */
  diffLocalCloud(cloudQuotas, cloudCheckins, cloudRatings) {
    const report = [];
    const compareList = (localList, cloudList, kind) => {
      const lMap = {};
      (localList || []).forEach(x => lMap[x.localId || x.local_id || x.id] = x);
      const cMap = {};
      (cloudList || []).forEach(x => cMap[x.localId || x.local_id || x.id] = x);

      // 本地有云端无 → 待推送
      Object.keys(lMap).forEach(k => {
        if (!cMap[k]) {
          report.push({ type: 'local_only', kind, key: k, direction: 'local_to_cloud' });
        }
      });
      // 云端有本地无 → 待拉取
      Object.keys(cMap).forEach(k => {
        if (!lMap[k]) {
          report.push({ type: 'cloud_only', kind, key: k, direction: 'cloud_to_local' });
        }
      });
      // 两边都有 → 逐字段比对（仅比对业务字段，忽略 _synced/updatedAt 等元数据）
      const compareFields = kind === 'quota'
        ? ['merchant', 'item', 'amount', 'totalTimes', 'usedTimes', 'expireDate', 'expire_date', 'note']
        : kind === 'checkin'
          ? ['merchant', 'deductTimes', 'checkinDate', 'checkinTime', 'isRevoked']
          : ['merchant', 'score', 'comment'];
      Object.keys(lMap).forEach(k => {
        const l = lMap[k], c = cMap[k];
        if (!c) return;
        for (const f of compareFields) {
          const lv = l[f] !== undefined ? l[f] : (f === 'usedTimes' ? l.used_times : f === 'totalTimes' ? l.total_times : f === 'checkinDate' ? l.checkin_date : f === 'expireDate' ? l.expire_date : undefined);
          const cv = c[f] !== undefined ? c[f] : (f === 'usedTimes' ? c.used_times : f === 'totalTimes' ? c.total_times : f === 'checkinDate' ? c.checkin_date : f === 'expireDate' ? c.expire_date : undefined);
          if (JSON.stringify(lv) === JSON.stringify(cv)) continue;
          const lts = l.updatedAt || l.updated_at || 0;
          const cts = c.updatedAt || c.updated_at || 0;
          let direction;
          if (f === 'usedTimes' || f === 'used_times') {
            // 计数器：取大值，方向为增量合并
            direction = (lv || 0) >= (cv || 0) ? 'local_to_cloud' : 'cloud_to_local';
          } else if (lts > cts) {
            direction = 'local_to_cloud';
          } else if (cts > lts) {
            direction = 'cloud_to_local';
          } else {
            direction = 'conflict';
          }
          report.push({ type: 'field_diff', kind, key: k, field: f, local: lv, cloud: cv, direction });
        }
      });
    };

    compareList(storage.getQuotas(), cloudQuotas, 'quota');
    compareList(storage.getCheckins(), cloudCheckins, 'checkin');
    compareList(storage.getRatings(), cloudRatings, 'rating');
    return report;
  }

  /**
   * 合并云端数据到本地（智能分层）
   */
  merge(cloudQuotas, cloudCheckins, cloudRatings) {
    // 配额合并：智能分层
    const localQuotas = storage.getQuotas() || [];
    const qMap = {};
    localQuotas.forEach(q => qMap[q.localId || q.local_id || q.id] = q);
    cloudQuotas.forEach(cq => {
      const key = cq.localId || cq.local_id || cq.id;
      if (!key) return;
      const existing = qMap[key];
      qMap[key] = existing ? this.mergeQuota(existing, cq) : { ...cq };
    });
    storage.setQuotas(Object.values(qMap));

    // 签到合并：localId 去重 + updatedAt 大者胜（记录不可变）
    const localCheckins = storage.getCheckins() || [];
    const cMap = {};
    localCheckins.forEach(c => cMap[c.localId || c.local_id || c.id] = c);
    cloudCheckins.forEach(cc => {
      const key = cc.localId || cc.local_id || cc.id;
      if (!key) return;
      const existing = cMap[key];
      const cloudTs = cc.updatedAt || cc.updated_at || 0;
      const localTs = existing ? (existing.updatedAt || existing.updated_at || 0) : 0;
      if (!existing || cloudTs > localTs) {
        cMap[key] = cc;
      }
    });
    storage.setCheckins(Object.values(cMap));

    // 评价合并：localId 去重 + updatedAt 大者胜（修复"本地优先"导致云端更新永不生效）
    const localRatings = storage.getRatings() || [];
    const rMap = {};
    localRatings.forEach(r => rMap[r.localId || r.local_id || r.id] = r);
    cloudRatings.forEach(cr => {
      const key = cr.localId || cr.local_id || cr.id;
      if (!key) return;
      const existing = rMap[key];
      const cloudTs = cr.updatedAt || cr.updated_at || cr.createdAt || cr.created_at || 0;
      const localTs = existing ? (existing.updatedAt || existing.updated_at || existing.createdAt || existing.created_at || 0) : 0;
      if (!existing || cloudTs > localTs) {
        rMap[key] = cr;
      }
    });
    storage.setRatings(Object.values(rMap));
  }

  /**
   * 推送本地数据到云端（增量）
   */
  async push(app) {
    const localQuotas = storage.getQuotas();
    const localCheckins = storage.getCheckins();
    const localRatings = storage.getRatings();

    // 配额推送
    let pushedQuota = 0;
    for (const q of localQuotas) {
      if (q._synced) continue;
      try {
        const payload = {
          localId: q.localId || q.local_id || q.id,
          merchant: q.merchant || '',
          item: q.item || '',
          amount: q.amount || 0,
          totalTimes: q.total_times || q.totalTimes || 0,
          usedTimes: q.used_times || q.usedTimes || 0,
          expireDate: q.expire_date || q.expireDate || '',
          note: q.note || '',
        };
        await app.callApi('/api/quotas', 'POST', payload);
        q._synced = true;  // 推送成功标记已同步
        pushedQuota++;
      } catch (e) { /* 单条失败不阻塞 */ }
    }
    // 签到推送
    let pushedCheckin = 0;
    for (const c of localCheckins) {
      if (c._synced) continue;
      try {
        await app.callApi('/api/checkins', 'POST', {
          localId: c.localId || c.local_id || c.id,
          quotaId: c.quotaId || c.quota_id || '',
          merchant: c.merchant || '',
          deductTimes: c.deduct_times || c.deductTimes || 1,
          checkinDate: c.checkin_date || c.checkinDate,
          checkinTime: c.checkin_time || c.checkinTime || '',
        });
        c._synced = true;  // 推送成功标记已同步
        pushedCheckin++;
      } catch (e) {}
    }
    // 评价推送
    let pushedRating = 0;
    for (const r of localRatings) {
      if (r._synced) continue;
      try {
        await app.callApi('/api/ratings', 'POST', {
          localId: r.localId || r.local_id || r.id,
          merchant: r.merchant || '',
          score: r.score || 5,
          comment: r.comment || '',
        });
        r._synced = true;  // 推送成功标记已同步
        pushedRating++;
      } catch (e) {}
    }

    // 持久化 _synced 标记
    storage.setQuotas(localQuotas);
    storage.setCheckins(localCheckins);
    storage.setRatings(localRatings);

    storage.setSyncStatus({ lastSyncTime: Date.now(), hasPendingSync: pushedQuota + pushedCheckin + pushedRating > 0 });
    return pushedQuota + pushedCheckin + pushedRating;
  }
}

module.exports = new SyncManager();
