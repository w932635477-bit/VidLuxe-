/**
 * 测试不同效果生成不同的 Prompt
 * 验证修复：effectId 应该正确传递到 getStyleProfile
 */

import { getStyleProfile } from '../lib/style-profile';

async function testEffectPrompts() {
  console.log('=== 测试不同效果的 Prompt 生成 ===\n');

  const effects = [
    { id: 'outfit-magazine', name: '穿搭-杂志大片' },
    { id: 'beauty-oriental', name: '美妆-新中式' },
    { id: 'beauty-korean', name: '美妆-韩系清透' },
    { id: 'outfit-korean-premium', name: '穿搭-韩系高级' },
  ];

  const prompts: { effectId: string; name: string; prompt: string }[] = [];

  for (const effect of effects) {
    const profile = await getStyleProfile({
      sourceType: 'preset',
      effectId: effect.id,
      effectIntensity: 100,
    });

    // 只取 prompt 的前 200 个字符进行比较
    const promptPreview = profile.prompt.substring(0, 200);
    prompts.push({
      effectId: effect.id,
      name: effect.name,
      prompt: promptPreview,
    });

    console.log(`\n--- ${effect.name} (${effect.id}) ---`);
    console.log(`Prompt: ${promptPreview}...`);
  }

  // 检查是否有不同的 prompt
  console.log('\n=== 验证 Prompt 差异性 ===\n');

  const uniquePrompts = new Set(prompts.map(p => p.prompt));
  console.log(`唯一 Prompt 数量: ${uniquePrompts.size} / ${prompts.length}`);

  if (uniquePrompts.size === prompts.length) {
    console.log('✅ 所有效果的 Prompt 都不同！');
  } else if (uniquePrompts.size === 1) {
    console.log('❌ 所有效果的 Prompt 都相同！');
    console.log('\n相同的 Prompt:');
    console.log(prompts[0].prompt);
  } else {
    console.log('⚠️ 部分效果的 Prompt 相同');

    // 找出相同的 prompt
    const grouped = new Map<string, string[]>();
    for (const p of prompts) {
      if (!grouped.has(p.prompt)) {
        grouped.set(p.prompt, []);
      }
      grouped.get(p.prompt)!.push(p.name);
    }

    for (const [prompt, names] of grouped) {
      if (names.length > 1) {
        console.log(`\n相同 Prompt 的效果: ${names.join(', ')}`);
      }
    }
  }
}

testEffectPrompts().catch(console.error);
