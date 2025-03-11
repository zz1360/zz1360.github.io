import{_ as a,c as e,o as t,a as n}from"./app-DukR-6js.js";const s={};function o(i,r){return t(),e("div",null,r[0]||(r[0]=[n('<h2 id="简介" tabindex="-1"><a class="header-anchor" href="#简介" aria-hidden="true">#</a> 简介</h2><p>虚拟线程（Virtual Thread）是 JDK 而不是 OS 实现的轻量级线程(Lightweight Process，LWP），由 JVM 调度。许多虚拟线程共享同一个操作系统线程，虚拟线程的数量可以远大于操作系统线程的数量。</p><h2 id="虚拟线程的优缺点" tabindex="-1"><a class="header-anchor" href="#虚拟线程的优缺点" aria-hidden="true">#</a> 虚拟线程的优缺点</h2><h3 id="优点" tabindex="-1"><a class="header-anchor" href="#优点" aria-hidden="true">#</a> 优点</h3><p><strong>非常轻量级</strong>：可以在单个线程中创建成百上千个虚拟线程而不会导致过多的线程创建和上下文切换。</p><p><strong>简化异步编程</strong>： 虚拟线程可以简化异步编程，使代码更易于理解和维护。它可以将异步代码编写得更像同步代码，避免了回调地狱（Callback Hell）。</p><p><strong>减少资源开销</strong>： 由于虚拟线程是由 JVM 实现的，它能够更高效地利用底层资源，例如 CPU 和内存。<strong>虚拟线程的上下文切换比平台线程更轻量</strong>，因此能够更好地支持高并发场景。</p><h3 id="缺点" tabindex="-1"><a class="header-anchor" href="#缺点" aria-hidden="true">#</a> 缺点</h3><ul><li><strong>不适用于计算密集型任务</strong>： 虚拟线程适用于 I/O 密集型任务，但不适用于计算密集型任务，因为密集型计算始终需要 CPU 资源作为支持。</li><li><strong>与某些第三方库不兼容</strong>： 虽然虚拟线程设计时考虑了与现有代码的兼容性，但某些依赖平台线程特性的第三方库可能不完全兼容虚拟线程。</li></ul><p><strong>注意</strong>：有段时间 JDK 一直致力于 Reactor 响应式编程来提高 Java 性能，但响应式编程难以理解、调试、使用，最终又回到了同步编程，最终虚拟线程诞生。</p>',10)]))}const d=a(s,[["render",o],["__file","feature001.html.vue"]]);export{d as default};
