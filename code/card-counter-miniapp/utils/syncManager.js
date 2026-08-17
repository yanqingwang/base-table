// utils/syncManager.js - 数据同步（云端优先合并 + 删除墓碑）
// 重要：usedTimes(已用次数) 是服务端纯派生字段，由 checkins 聚合计算。
// 客户端永不上传、永不作为写入依据，避免多端 push 把旧值覆盖回服务端造成"冲正薅次数"。
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
   * 合并配额：
   * - usedTimes 直接采用云端值（服务端由签到记录派生，唯一权威来源）
   * - 其余字段以云端(网页)为准，做字段级收敛
   */
  mergeQuota(local, cloud) {
    const localTs = local.updatedAt || local.updated_at || 0;
    const cloudTs = cloud.updatedAt || cloud.updated_at || 0;
    const merged = { ...local };

  // 1. usedTimes 以云端为准（云端由签到记录派生计算，权威）；客户端不上传该字段，此处直接采用云端值
  const cu = this.getField(cloud, 'used_times') || 0;
  this.setField(merged, 'used_times', cu);

    // 2. 其余字段逐字段以云端(网页)为准：云端非空且与本地不同 → 采用云端
    //    （解决网页/小程序次卡字段不一致；本地为空、云端有值也采用云端补齐）
    for (const f of QUOTA_FIELDS) {
      if (f === 'used_times' || f === 'usedTimes') continue; // 计数器已特殊处理（含驼峰变体）
      const lv = this.getField(local, f);
      const cv = this.getField(cloud, f);
      const lvEmpty = lv === undefined || lv === null || lv === '' || (typeof lv === 'object' && lv !== null && Object.keys(lv).length === 0);
      const cvEmpty = cv === undefined || cv === null || cv === '' || (typeof cv === 'object' && cv !== null && Object.keys(cv).length === 0);
      if (lvEmpty && cvEmpty) continue;       // 双方都空，无需处理
      if (cvEmpty) continue;                  // 云端为空，保留本地值（不反向清空本地）
      // 本地为空，或值不同 → 采用云端（网页为主，统一收敛）
      this.setField(merged, f, cv);
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
            // 计数器已改为云端派生计算，方向统一为云端覆盖本地
            direction = 'cloud_to_local';
          } else if (kind === 'checkin' || kind === 'quota' || kind === 'rating') {
            // 所有业务字段均以网页(云端)为唯一权威源，差异方向统一为云端覆盖本地，
            // 避免错误标记「有未同步数据」（合并时本就采用云端值）
            direction = 'cloud_to_local';
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
    const removedQuotaKeys = new Set();
    Object.keys(qMap).forEach(key => {
      const q = qMap[key];
      if ((q._synced === true || q._cloudKnown === true) && !cloudQKeys.has(key)) {
        delete qMap[key];
        removedQuotaKeys.add(key);
      }
    });
    storage.setQuotasSilent(Object.values(qMap));

    // ── 签到合并：localId 去重 + updatedAt 大者胜；撤销状态以云端为准 ──
    const localCheckins = storage.getCheckins() || [];
    const cMap = {};
    localCheckins.forEach(c => cMap[c.localId || c.local_id || c.id] = c);
    // 配额已在其他端被删除 → 其本地签到一并清理，避免孤儿签到被再次推送
    if (removedQuotaKeys.size > 0) {
      Object.keys(cMap).forEach(key => {
        const c = cMap[key];
        const cKey = String(c.quotaId || c.quota_id || '');
        if (cKey && removedQuotaKeys.has(cKey)) {
          delete cMap[key];
        }
      });
    }
    (cloudCheckins || []).forEach(cc => {
      const key = cc.localId || cc.local_id || cc.id;
      if (!key) return;
      const existing = cMap[key];
      const cloudTs = cc.updatedAt || cc.updated_at || 0;
      const localTs = existing ? (existing.updatedAt || existing.updated_at || 0) : 0;

      // 云端撤销不可逆：无论时间戳如何都采用撤销状态（网页为唯一权威源）
      if (cc.isRevoked) {
        cMap[key] = { ...existing, ...cc, isRevoked: true, _cloudKnown: true, updatedAt: Math.max(localTs, cloudTs) || Date.now() };
        return;
      }

      if (!existing) {
        cMap[key] = { ...cc, _cloudKnown: true };  // 云端新增 → 直接采用，并标记云端已知
        return;
      }

      // 字段级合并：以云端(网页)为准，冲突字段采用云端值（修复签到备注同步后不一致）
      // 仅当云端字段非空时才覆盖，避免云端空值清空本地已填备注
      const merged = { ...existing };
      const FIELDS = ['merchant', 'deductTimes', 'checkinDate', 'checkinTime', 'note'];
      for (const f of FIELDS) {
        const cv = cc[f];
        if (cv === undefined || cv === null || cv === '') continue;   // 云端为空，保留本地
        merged[f] = cv;
        if (f === 'deductTimes') merged.deduct_times = cv;
        else if (f === 'checkinDate') merged.checkin_date = cv;
        else if (f === 'checkinTime') merged.checkin_time = cv;
      }
      merged.isRevoked = !!cc.isRevoked;   // 以云端撤销状态为准
      merged._cloudKnown = true;           // 标记云端已知，供删除墓碑使用
      merged.updatedAt = Math.max(localTs, cloudTs) || Date.now();
      merged.updated_at = merged.updatedAt;
      cMap[key] = merged;
    });
    storage.setCheckinsSilent(Object.values(cMap));

    // ── 签到删除墓碑：云端已知但本次拉取已不存在的记录 → 视为在其他端被删除，本地同步移除 ──
    // （仅移除已同步过 / 曾出现在云端的记录；纯本地未推送记录保留，避免误删离线新建数据）
    const cloudCKeys = new Set((cloudCheckins || []).map(cc => cc.localId || cc.local_id || cc.id).filter(Boolean));
    Object.keys(cMap).forEach(key => {
      const c = cMap[key];
      if ((c._synced === true || c._cloudKnown === true) && !cloudCKeys.has(key)) {
        delete cMap[key];
      }
    });
    storage.setCheckinsSilent(Object.values(cMap));

    // ── 评价合并：localId 去重 + 以云端(网页)为准（字段级）──
    const localRatings = storage.getRatings() || [];
    const rMap = {};
    localRatings.forEach(r => rMap[r.localId || r.local_id || r.id] = r);
    (cloudRatings || []).forEach(cr => {
      const key = cr.localId || cr.local_id || cr.id;
      if (!key) return;
      const existing = rMap[key];
      if (!existing) {
        rMap[key] = { ...cr, _cloudKnown: true };   // 云端新增 → 直接采用，标记云端已知
        return;
      }
      // 字段级以云端(网页)为准：云端非空值覆盖本地
      const merged = { ...existing };
      for (const f of ['merchant', 'score', 'comment']) {
        const cv = cr[f];
        if (cv === undefined || cv === null || cv === '') continue;
        merged[f] = cv;
      }
      const cloudTs = cr.updatedAt || cr.updated_at || cr.createdAt || cr.created_at || 0;
      const localTs = existing.updatedAt || existing.updated_at || existing.createdAt || existing.created_at || 0;
      merged.updatedAt = Math.max(localTs, cloudTs) || Date.now();
      merged.updated_at = merged.updatedAt;
      merged._cloudKnown = true;   // 标记云端已知，供删除墓碑使用
      rMap[key] = merged;
    });
    storage.setRatingsSilent(Object.values(rMap));

    // ── 评价删除墓碑：云端已知但本次拉取已不存在的记录 → 本地同步移除 ──
    // （仅移除已同步过 / 曾出现在云端的记录；纯本地未推送记录保留）
    const cloudRKeys = new Set((cloudRatings || []).map(cr => cr.localId || cr.local_id || cr.id).filter(Boolean));
    Object.keys(rMap).forEach(key => {
      const r = rMap[key];
      if ((r._synced === true || r._cloudKnown === true) && !cloudRKeys.has(key)) {
        delete rMap[key];
      }
    });
    storage.setRatingsSilent(Object.values(rMap));
  }

  /**
   * 推送本地数据到云端
   * @param {boolean} force 强制全量上传（忽略 _synced 标记，用于重建服务器数据 / 历史数据找回）
   */
  async push(app, force = false) {
    const localQuotas = storage.getQuotas();
    const localCheckins = storage.getCheckins();
    const localRatings = storage.getRatings();

    // 先推签到/评价（服务端据此聚合 quota.usedTimes），最后推配额。
    // 注意：配额 payload 不再携带 usedTimes —— 该字段由服务端派生，客户端上传会被忽略，
    // 若误传旧值还可能被"覆盖回服务端"造成核销效果被冲正，故必须剔除。
    // 签到推送
    let pushedCheckin = 0;
    for (const c of localCheckins) {
      if (!force && c._synced) continue;
      try {
        await app.callApi('/api/checkins', 'POST', {
          localId: c.localId || c.local_id || c.id,
          quotaId: c.quotaId || c.quota_id || '',
          merchant: c.merchant || '',
          deductTimes: (c.deductTimes != null ? c.deductTimes : (c.deduct_times != null ? c.deduct_times : 1)),
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
    // 配额推送（不含 usedTimes，服务端按 checkins 聚合派生）
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
          expireDate: q.expire_date || q.expireDate || '',
          note: q.note || '',
        };
        await app.callApi('/api/quotas', 'POST', payload);
        q._synced = true;  // 推送成功标记已同步
        pushedQuota++;
      } catch (e) { /* 单条失败不阻塞 */ }
    }

    // 持久化 _synced 标记
    storage.setQuotasSilent(localQuotas);
    storage.setCheckinsSilent(localCheckins);
    storage.setRatingsSilent(localRatings);

    storage.setSyncStatus({ lastSyncTime: Date.now(), hasPendingSync: pushedQuota + pushedCheckin + pushedRating > 0 });
    return pushedQuota + pushedCheckin + pushedRating;
  }
}

module.exports = new SyncManager();
