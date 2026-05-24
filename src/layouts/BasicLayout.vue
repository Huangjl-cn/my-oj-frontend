<template>
  <div id="basicLayout">
    <a-layout class="layout-wrapper">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <div class="router-wrap">
          <router-view />
        </div>
      </a-layout-content>
      <a-layout-footer class="footer">
        <div class="footer-inner">
          <Transition name="quote-fade" mode="out-in">
            <div class="footer-quote" :key="quoteIndex">
              <span class="quote-text">" {{ quotes[quoteIndex].text }} "</span>
              <span class="quote-sep">--</span>
              <span class="quote-author">
                {{ quotes[quoteIndex].author }},
                {{ quotes[quoteIndex].country }}
              </span>
            </div>
          </Transition>
        </div>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<style scoped>
#basicLayout {
  height: 100vh;
  overflow: hidden;
  background: var(--canvas);
}

#basicLayout .layout-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

#basicLayout .header {
  background: var(--canvas) !important;
  border-bottom: 1px solid var(--hairline);
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
}

#basicLayout .content {
  background: transparent !important;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.router-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 约束 router-view（如果它渲染成 DOM 元素） */
.router-wrap > :deep(router-view) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

#basicLayout .footer {
  background: var(--surface-dark) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
  padding: 10px var(--space-lg) 6px;
  line-height: 1;
}

.footer-inner {
  margin: 0 var(--space-lg);
  text-align: center;
}

.footer-quote {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 6px;
  min-height: 20px;
}

.quote-text {
  font-family: "Cormorant Garamond", Garamond, "Times New Roman", serif;
  font-size: 12px;
  font-weight: 400;
  font-style: italic;
  color: var(--on-dark);
  line-height: 1.4;
  letter-spacing: 0.02em;
  min-width: 0;
}

.quote-sep {
  color: var(--on-dark-soft);
  font-size: 10px;
  flex-shrink: 0;
}

.quote-author {
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 500;
  color: var(--on-dark-soft);
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;
}

.quote-fade-enter-active,
.quote-fade-leave-active {
  transition: opacity 0.6s ease;
}

.quote-fade-enter-from,
.quote-fade-leave-to {
  opacity: 0;
}
</style>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import GlobalHeader from "@/components/GlobalHeader.vue";

const quotes = [
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts",
    author: "Winston Churchill",
    country: "UK",
  },
  { text: "学而不思则罔，思而不学则殆", author: "孔子", country: "中国" },
  { text: "千里之行，始于足下", author: "老子", country: "中国" },
  { text: "天行健，君子以自强不息", author: "《周易》", country: "中国" },
  { text: "路漫漫其修远兮，吾将上下而求索", author: "屈原", country: "中国" },
  { text: "长风破浪会有时，直挂云帆济沧海", author: "李白", country: "中国" },
  { text: "天生我材必有用", author: "李白", country: "中国" },
  { text: "会当凌绝顶，一览众山小", author: "杜甫", country: "中国" },
  { text: "人生自古谁无死，留取丹心照汗青", author: "文天祥", country: "中国" },
  {
    text: "世上本没有路，走的人多了，也便成了路",
    author: "鲁迅",
    country: "中国",
  },
  { text: "横眉冷对千夫指，俯首甘为孺子牛", author: "鲁迅", country: "中国" },
  {
    text: "宝剑锋从磨砺出，梅花香自苦寒来",
    author: "《警世贤文》",
    country: "中国",
  },
  { text: "不积跬步，无以至千里", author: "荀子", country: "中国" },
  { text: "志当存高远", author: "诸葛亮", country: "中国" },
  {
    text: "The only way to do great work is to love what you do",
    author: "Steve Jobs",
    country: "USA",
  },
  { text: "Stay hungry, stay foolish", author: "Steve Jobs", country: "USA" },
  { text: "I have a dream", author: "Martin Luther King Jr.", country: "USA" },
  {
    text: "The future belongs to those who believe in the beauty of their dreams",
    author: "Eleanor Roosevelt",
    country: "USA",
  },
  {
    text: "Life is what happens when you're busy making other plans",
    author: "John Lennon",
    country: "UK",
  },
  {
    text: "Imagination is more important than knowledge",
    author: "Albert Einstein",
    country: "USA",
  },
  {
    text: "Try not to become a man of success, but rather try to become a man of value",
    author: "Albert Einstein",
    country: "USA",
  },
  {
    text: "The only thing we have to fear is fear itself",
    author: "Franklin D. Roosevelt",
    country: "USA",
  },
  {
    text: "To be or not to be, that is the question",
    author: "William Shakespeare",
    country: "UK",
  },
  {
    text: "The unexamined life is not worth living",
    author: "Socrates",
    country: "古希腊",
  },
  {
    text: "Plato is dear to me, but dearer still is truth",
    author: "Aristotle",
    country: "古希腊",
  },
  {
    text: "I think, therefore I am",
    author: "René Descartes",
    country: "法国",
  },
  {
    text: "The secret of getting ahead is getting started",
    author: "Mark Twain",
    country: "USA",
  },
  {
    text: "知之者不如好之者，好之者不如乐之者",
    author: "孔子",
    country: "中国",
  },
  {
    text: "In the middle of difficulty lies opportunity",
    author: "Albert Einstein",
    country: "USA",
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now",
    author: "Chinese Proverb",
    country: "中国",
  },
  {
    text: "Simplicity is the ultimate sophistication",
    author: "Leonardo da Vinci",
    country: "意大利",
  },
  {
    text: "Be the change that you wish to see in the world",
    author: "Mahatma Gandhi",
    country: "印度",
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop",
    author: "Confucius",
    country: "中国",
  },
  { text: "不要把鸡蛋放在同一个篮子里", author: "培根", country: "英国" },
  {
    text: "业精于勤，荒于嬉；行成于思，毁于随",
    author: "韩愈",
    country: "中国",
  },
  { text: "纸上得来终觉浅，绝知此事要躬行", author: "陆游", country: "中国" },
  {
    text: "All that glitters is not gold",
    author: "William Shakespeare",
    country: "UK",
  },
  {
    text: "Genius is one percent inspiration and ninety-nine percent perspiration",
    author: "Thomas Edison",
    country: "USA",
  },
  {
    text: "The only impossible journey is the one you never begin",
    author: "Tony Robbins",
    country: "USA",
  },
  {
    text: "不要因为走得太远而忘记为什么出发",
    author: "纪伯伦",
    country: "黎巴嫩",
  },
  {
    text: "It is during our darkest moments that we must focus to see the light",
    author: "Aristotle",
    country: "古希腊",
  },
  {
    text: "Perseverance is not a long race; it is many short races one after the other",
    author: "Walter Elliot",
    country: "UK",
  },
  { text: "山重水复疑无路，柳暗花明又一村", author: "陆游", country: "中国" },
  { text: "少年易老学难成，一寸光阴不可轻", author: "朱熹", country: "中国" },
  {
    text: "Courage is grace under pressure",
    author: "Ernest Hemingway",
    country: "USA",
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us",
    author: "Ralph Waldo Emerson",
    country: "USA",
  },
  {
    text: "古之立大事者，不惟有超世之才，亦必有坚忍不拔之志",
    author: "苏轼",
    country: "中国",
  },
  { text: "静以修身，俭以养德", author: "诸葛亮", country: "中国" },
  {
    text: "人生的价值，并不是用时间，而是用深度去衡量的",
    author: "列夫·托尔斯泰",
    country: "俄罗斯",
  },
  { text: "所谓无底深渊，下去，也是前程万里", author: "木心", country: "中国" },
];

const quoteIndex = ref(0);
let quoteTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  quoteTimer = setInterval(() => {
    quoteIndex.value = (quoteIndex.value + 1) % quotes.length;
  }, 60000);
});

onBeforeUnmount(() => {
  if (quoteTimer) clearInterval(quoteTimer);
});
</script>
