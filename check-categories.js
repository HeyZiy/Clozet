const pool = require('./db');

const DEFAULT_CATEGORIES = ['短袖', '长袖', '外套', '裤子', '短裤', '羽绒服', '秋衣', '内衣', '袜子', '鞋子', '配饰', '特殊'];

async function checkAndFix() {
  try {
    // 获取所有不同的分类
    const result = await pool.query("SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != ''");
    const existingCategories = result.rows.map(r => r.category);

    console.log('数据库中的现有分类:', existingCategories);

    // 找出不在默认列表中的分类
    const invalidCategories = existingCategories.filter(c => !DEFAULT_CATEGORIES.includes(c));

    if (invalidCategories.length > 0) {
      console.log('\n不符合规则的分类:', invalidCategories);
      console.log('这些分类将被清空...');

      // 将不符合规则的分类置为空
      for (const cat of invalidCategories) {
        await pool.query("UPDATE items SET category = '' WHERE category = $1", [cat]);
        console.log(`已清空分类: ${cat}`);
      }

      console.log('\n处理完成，不符合规则的分类已清空');
    } else {
      console.log('\n所有分类都符合规则，无需处理');
    }

    process.exit(0);
  } catch (err) {
    console.error('检查失败:', err);
    process.exit(1);
  }
}

checkAndFix();
