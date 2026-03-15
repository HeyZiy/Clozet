export const FILES = {
  purchases: 'data/purchases.csv',
  inventory: 'data/inventory.csv',
  storage: 'data/storage.csv',
  discard: 'data/discard.csv',
};

export const OPTIONS_SEASONS = ['春', '夏', '秋', '冬', '春秋', '秋冬', '四季通用'];
export const OPTIONS_STATUSES = ['已下单', '正在使用', '已收纳', '已入库', '待处理', '已淘汰', '预售', '咸鱼在售', '已售出'];

// 可输入下拉框选项 - 分类
export const OPTIONS_CATEGORIES = ['短袖', '长袖', '外套', '裤子', '短裤', '羽绒服', '秋衣', '内衣', '袜子', '鞋子', '配饰', '特殊'];

// 可输入下拉框选项 - 品牌
export const OPTIONS_BRANDS = ['优衣库', 'UNIQLO', 'ZARA', 'H&M', '耐克', 'NIKE', '阿迪达斯', 'ADIDAS', '李宁', '安踏', '太平鸟', '森马', '美特斯邦威', '以纯'];

// 可输入下拉框选项 - 购买途径
export const OPTIONS_SOURCES = ['淘宝', '京东', '拼多多', '1688', '小红书', '抖音', '快手', '线下', '其他'];

export const DEFAULT_BUDGETS = {
  yearly: 12000,
  monthly: 1000
};
