// utils/learningPlan.js - 学习建议算法（加权天数）
const storage = require('./storage');

class LearningPlanCalculator {
  constructor() {
    this.config = storage.getLearningPlan();
  }

  /**
   * 计算加权天数（周末权重2，工作日权重1，假期权重1.5）
   */
  calculateWeightedDays(startDate, endDate) {
    let current = new Date(startDate);
    let weightedDays = 0;
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weightedDays += this.config.weekendWeight || 2;
      } else {
        weightedDays += this.config.weekdayWeight || 1;
      }
      if (this.isHoliday(current)) {
        weightedDays += (this.config.holidayWeight || 1.5) - 1;
      }
      current.setDate(current.getDate() + 1);
    }
    return Math.max(weightedDays, 1);
  }

  isHoliday(date) {
    const holidays = this.config.holidays || [];
    const dateStr = this.formatDate(date);
    return holidays.some(h => dateStr >= h.start && dateStr <= h.end);
  }

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  daysBetween(start, end) {
    return Math.max(0, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
  }

  /**
   * 全局建议：综合所有进行中配额
   */
  calculateGlobalSuggestion(quotas) {
    const active = quotas.filter(q => this.getStatus(q) === '进行中');
    if (active.length === 0) {
      return { totalRemaining: 0, suggestInterval: 0, message: '暂无进行中的配额' };
    }

    let totalRemaining = 0;
    let nearestExpire = null;

    active.forEach(q => {
      const remaining = (q.total_times || q.totalTimes || 0) - (q.used_times || q.usedTimes || 0);
      totalRemaining += Math.max(0, remaining);
      const expire = q.expire_date || q.expireDate;
      if (expire && (!nearestExpire || new Date(expire) < new Date(nearestExpire))) {
        nearestExpire = expire;
      }
    });

    if (!nearestExpire || totalRemaining === 0) {
      return { totalRemaining, suggestInterval: 0, message: `综合剩余 ${totalRemaining} 次` };
    }

    const weightedDays = this.calculateWeightedDays(new Date(), new Date(nearestExpire));
    const suggestInterval = Math.ceil(weightedDays / totalRemaining);
    return {
      totalRemaining,
      suggestInterval,
      message: `综合剩余 ${totalRemaining} 次，建议平均每 ${suggestInterval} 天参加一次`,
    };
  }

  /**
   * 单条配额建议
   */
  calculateQuotaSuggestion(q) {
    const total = q.total_times || q.totalTimes || 0;
    const used = q.used_times || q.usedTimes || 0;
    const remaining = total - used;
    const expire = q.expire_date || q.expireDate;
    const today = new Date();
    const daysLeft = expire ? this.daysBetween(today, expire) : 365;

    if (!expire) {
      return { remaining, daysLeft, message: `剩余 ${remaining} 次，无到期限制` };
    }
    if (daysLeft <= 0) {
      return { remaining, daysLeft: 0, message: '配额已过期' };
    }
    if (remaining <= 0) {
      return { remaining, daysLeft, message: '配额已用完' };
    }

    const weightedDays = this.calculateWeightedDays(today, new Date(expire));
    const intervalSuggestion = Math.ceil(weightedDays / remaining);
    return {
      remaining,
      daysLeft,
      intervalSuggestion,
      message: `建议每 ${intervalSuggestion} 天参加一次（剩余 ${remaining} 次，${daysLeft} 天到期）`,
    };
  }

  /**
   * 配额状态：进行中 / 已用完 / 已过期
   */
  getStatus(q) {
    const total = q.total_times || q.totalTimes || 0;
    const used = q.used_times || q.usedTimes || 0;
    const expire = q.expire_date || q.expireDate;
    if (expire && new Date(expire + 'T23:59:59') < new Date()) return '已过期';
    if (used >= total) return '已用完';
    return '进行中';
  }
}

module.exports = new LearningPlanCalculator();
