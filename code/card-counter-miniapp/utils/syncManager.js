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

    // 2. 其余字段逐字段 LWW（本地为空时采用云端补齐，避免网页编辑的备注/偏好等无法同步到小程序）
    const conflicts = [];
    for (const f of QUOTA_FIELDS) {
      if (f === 'used_times' || f === 'usedTimes') continue; // 计数器已特殊处理（含驼峰变体）
      const lv = this.getField(local, f);
      const cv = this.getField(cloud, f);
      const lvEmpty = lv === undefined || lv === null || lv === '' || (typeof lv === 'object' && lv !== null && Object.keys(lv).length === 0);
      const cvEmpty = cv === undefined || cv === null || cv === '' || (typeof cv === 'object' && cv !== null && Object.keys(cv).length === 0);
      if (lvEmpty && cvEmpty) continue;       // 双方都空，无需处理
      if (cvEmpty) continue;                  // 云端为空，保留本地值
      if (lvEmpty) { this.setField(merged, f, cv); continue; }  // 本地为空、云端有值 → 采用云端（补齐网页备注等）
      if (JSON.stringify(lv) === JSON.stringify(cv)) continue;
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
          ? ['merchant', 'deductTimes', 'checkinDate', 'checkinTime', 'isRevoked', 'note']
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
   * - 配额：字段级 LWW；云端已知但本次拉取不存在的记录 → 视为在其他端被删除，本地同步移除
   * - 签到：记录级 LWW；撤销状态以云端为准（不可逆，避免本地时间戳偏大导致撤销不同步）
   * - 撤销补偿：本次新发现的云端撤销 → 从对应配额 usedTimes 中扣回次数
   */
  merge(cloudQuotas, cloudCheckins, cloudRatings) {
    // ── 配额合并：智能分层 + 删除同步 ──
    const localQuotas = storage.getQuotas() || [];
    const qMap = {};
    localQuotas.forEach(q => qMap[q.localId || q.local_id || q.id] = q);

    const cloudQKeys = new Set();
    (cloudQuotas || []).forEach(cq => {
      const key = cq.localId || cq.local_id || cq.id;
      if (!key) return;
      cloudQKeys.add(key);
      const existing = qMap[key];
      qMap[key] = existing ? this.mergeQuota(existing, cq) : { ...cq };
      qMap[key]._cloudKnown = true; // 标记曾出现在云端，用于后续删除同步
    });
    // 本地残留的云端已知记录（网页端已删除）→ 从本地移除；未同步过的本地记录保留待推送
    Object.keys(qMap).forEach(key => {
      const q = qMap[key];
      if ((q._synced === true || q._cloudKnown === true) && !cloudQKeys.has(key)) {
        delete qMap[key];
      }
    });
    storage.setQuotas(Object.values(qMap));

    // ── 签到合并：localId 去重 + updatedAt 大者胜；撤销状态以云端为准 ──
    const localCheckins = storage.getCheckins() || [];
    const cMap = {};
    localCheckins.forEach(c => cMap[c.localId || c.local_id || c.id] = c);
    const newlyRevoked = []; // { quotaId, deductTimes } 本次新发现的云端撤销
    (cloudCheckins || []).forEach(cc => {
      const key = cc.localId || cc.local_id || cc.id;
      if (!key) return;
      const existing = cMap[key];
      const cloudTs = cc.updatedAt || cc.updated_at || 0;
      const localTs = existing ? (existing.updatedAt || existing.updated_at || 0) : 0;
      if (existing && cc.isRevoked && !existing.isRevoked) {
        // 云端撤销不可逆：无论时间戳如何都采用撤销状态，并记录待补偿的扣减次数
        cMap[key] = { ...existing, ...cc, isRevoked: true, updatedAt: Math.max(localTs, cloudTs) || Date.now() };
        newlyRevoked.push({
          quotaId: cc.quotaId || cc.quota_local_id || existing.quotaId || existing.quota_local_id || '',
          deductTimes: cc.deductTimes || existing.deductTimes || 1,
        });
      } else if (!existing || cloudTs > localTs) {
        cMap[key] = cc;
      }
    });
    storage.setCheckins(Object.values(cMap));

    // ── 撤销补偿：本次拉取新发现的云端撤销 → 从配额已用次数扣回 ──
    if (newlyRevoked.length) {
      const quotas = storage.getQuotas();
      for (const r of newlyRevoked) {
        if (!r.quotaId) continue;
        const q = quotas.find(x => String(x.localId || x.local_id || x.id) === String(r.quotaId));
        if (q) {
          q.usedTimes = Math.max(0, (q.usedTimes || 0) - r.deductTimes);
        }
      }
      storage.setQuotas(quotas);
    }

    // ── 评价合并：localId 去重 + updatedAt 大者胜（修复"本地优先"导致云端更新永不生效）──
    const localRatings = storage.getRatings() || [];
    const rMap = {};
    localRatings.forEach(r => rMap[r.localId || r.local_id || r.id] = r);
    (cloudRatings || []).forEach(cr => {
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
   * 推送本地数据到云端
   * @param {boolean} force 强制全量上传（忽略 _synced 标记，用于重建服务器数据 / 历史数据找回）
   */
  async push(app, force = false) {
    const localQuotas = storage.getQuotas();
    const localCheckins = storage.getCheckins();
    const localRatings = storage.getRatings();

    // 先推签到/评价（服务端会累加 quota usedTimes），最后推配额（本地 usedTimes 权威覆盖）
    // 顺序关键：配额最后推，避免全量上传时 usedTimes 被签到累加二次计数
    // 签到推送
    let pushedCheckin = 0;
    for (const c of localCheckins) {
      if (!force && c._synced) continue;
      try {
        await app.callApi('/api/checkins', 'POST', {
          localId: c.localId || c.local_id || c.id,
          quotaId: c.quotaId || c.quota_id || '',
          merchant: c.merchant || '',
          deductTimes: c.deduct_times || c.deductTimes || 1,
          checkinDate: c.checkin_date || c.checkinDate,
          checkinTime: c.checkin_time || c.checkinTime || '',
          note: c.note || '',
          isRevoked: !!c.isRevoked,
        });
        c._synced = true;  // 推送成功标记已同步
        pushedCheckin++;
      } catch (e) {}
    }
    // 评价推送
    let pushedRating = 0;
    for (const r of localRatings) {
      if (!force && r._synced) continue;
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
    // 配额推送（最后推：usedTimes 以本地为准，覆盖签到累加结果）
    let pushedQuota = 0;
    for (const q of localQuotas) {
      if (!force && q._synced) continue;
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

    // 持久化 _synced 标记
    storage.setQuotas(localQuotas);
    storage.setCheckins(localCheckins);
    storage.setRatings(localRatings);

    storage.setSyncStatus({ lastSyncTime: Date.now(), hasPendingSync: pushedQuota + pushedCheckin + pushedRating > 0 });
    return pushedQuota + pushedCheckin + pushedRating;
  }
}

module.exports = new SyncManager();
