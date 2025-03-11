import{_ as e,c as n,o as s,a as i}from"./app-DukR-6js.js";const l={};function r(t,a){return s(),n("div",null,a[0]||(a[0]=[i(`<p>对象晋升到老年代的年龄阈值，可以通过参数 <code>-XX:MaxTenuringThreshold</code> 来设置</p><p>使用 <code>-XX：MaxMetaspaceSize</code> 标志设置最大元空间大小，默认值为 unlimited，这意味着它只受系统内存的限制。</p><p>使用参数：<code>-XX:+PrintGCDetails</code>可以打印GC相关信息。</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token parameter variable">-XX:+UseParallelGC</span>

    使用 Parallel 收集器+ 老年代串行

<span class="token parameter variable">-XX:+UseParallelOldGC</span>

    使用 Parallel 收集器+ 老年代并行
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><code>-Xverify:none</code> 参数来关闭大部分的类验证措施，以缩短虚拟机类加载的时间。但是需要注意的是 <code>-Xverify:none</code> 和 <code>-noverify</code> 在 JDK 13 中被标记为 deprecated ，在未来版本的 JDK 中可能会被移除。</p><h3 id="显式指定堆内存" tabindex="-1"><a class="header-anchor" href="#显式指定堆内存" aria-hidden="true">#</a> 显式指定堆内存</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token comment"># 如果我们要为 JVM 分配最小 2 GB 和最大 5 GB 的堆内存大小，我们的参数应该这样来写：</span>
<span class="token parameter variable">-Xms2G</span> <span class="token parameter variable">-Xmx5G</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="显式指定新生代内存" tabindex="-1"><a class="header-anchor" href="#显式指定新生代内存" aria-hidden="true">#</a> 显式指定新生代内存</h3><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token comment"># 如果我们要为 新生代分配 最小 256m 的内存，最大 1024m 的内存我们的参数应该这样来写：</span>
<span class="token parameter variable">-XX:NewSize</span><span class="token operator">=</span>256m
<span class="token parameter variable">-XX:MaxNewSize</span><span class="token operator">=</span>1024m
<span class="token comment"># 如果我们要为 新生代分配 256m 的内存（NewSize 与 MaxNewSize 设为一致），我们的参数应该这样来写：</span>
<span class="token parameter variable">-Xmn256m</span>
<span class="token comment"># 比如下面的参数就是设置老年代与新生代内存的比值为 1。也就是说老年代和新生代所占比值为 1：1，新生代占整个堆栈的 1/2。</span>
<span class="token parameter variable">-XX:NewRatio</span><span class="token operator">=</span><span class="token number">1</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><div class="custom-container tip"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 8h.01"></path><path d="M11 12h1v4h1"></path></g></svg><p class="custom-container-title">TIP</p><p>GC 调优策略中很重要的一条经验总结是这样说的：</p><p>将新对象预留在新生代，由于 Full GC 的成本远高于 Minor GC，因此尽可能将对象分配在新生代是明智的做法，实际项目中根据 GC 日志分析新生代空间大小分配是否合理，适当通过“-Xmn”命令调节新生代大小，最大限度降低新对象直接进入老年代的情况。</p></div><h3 id="metaspace" tabindex="-1"><a class="header-anchor" href="#metaspace" aria-hidden="true">#</a> Metaspace</h3><p>Metaspace 的初始容量并不是 <code>-XX:MetaspaceSize</code> 设置，无论 <code>-XX:MetaspaceSize</code> 配置什么值，对于 64 位 JVM 来说，Metaspace 的初始容量都是 21807104（约 20.8m）。</p><p>Metaspace 由于使用不断扩容到<code>-XX:MetaspaceSize</code>参数指定的量，就会发生 FGC，且之后每次 Metaspace 扩容都会发生 Full GC。</p><p>也就是说，MetaspaceSize 表示 Metaspace 使用过程中触发 Full GC 的阈值，只对触发起作用。</p><h3 id="gc日志记录" tabindex="-1"><a class="header-anchor" href="#gc日志记录" aria-hidden="true">#</a> GC日志记录</h3><p>生产环境上，或者其他要测试 GC 问题的环境上，一定会配置上打印 GC 日志的参数，便于分析 GC 相关的问题。</p><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token comment"># 必选</span>
<span class="token comment"># 打印基本 GC 信息</span>
<span class="token parameter variable">-XX:+PrintGCDetails</span>
<span class="token parameter variable">-XX:+PrintGCDateStamps</span>
<span class="token comment"># 打印对象分布</span>
<span class="token parameter variable">-XX:+PrintTenuringDistribution</span>
<span class="token comment"># 打印堆数据</span>
<span class="token parameter variable">-XX:+PrintHeapAtGC</span>
<span class="token comment"># 打印Reference处理信息</span>
<span class="token comment"># 强引用/弱引用/软引用/虚引用/finalize 相关的方法</span>
<span class="token parameter variable">-XX:+PrintReferenceGC</span>
<span class="token comment"># 打印STW时间</span>
<span class="token parameter variable">-XX:+PrintGCApplicationStoppedTime</span>

<span class="token comment"># 可选</span>
<span class="token comment"># 打印safepoint信息，进入 STW 阶段之前，需要要找到一个合适的 safepoint</span>
<span class="token parameter variable">-XX:+PrintSafepointStatistics</span>
<span class="token parameter variable">-XX:PrintSafepointStatisticsCount</span><span class="token operator">=</span><span class="token number">1</span>

<span class="token comment"># GC日志输出的文件路径</span>
-Xloggc:/path/to/gc-%t.log
<span class="token comment"># 开启日志文件分割</span>
<span class="token parameter variable">-XX:+UseGCLogFileRotation</span>
<span class="token comment"># 最多分割几个文件，超过之后从头文件开始写</span>
<span class="token parameter variable">-XX:NumberOfGCLogFiles</span><span class="token operator">=</span><span class="token number">14</span>
<span class="token comment"># 每个文件上限大小，超过就触发分割</span>
<span class="token parameter variable">-XX:GCLogFileSize</span><span class="token operator">=</span>50M
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="处理oom" tabindex="-1"><a class="header-anchor" href="#处理oom" aria-hidden="true">#</a> 处理OOM</h2><div class="language-bash line-numbers-mode" data-ext="sh"><pre class="language-bash"><code><span class="token comment"># 这些参数将堆内存转储到一个物理文件中，以后可以用来查找泄漏</span>
<span class="token parameter variable">-XX:+HeapDumpOnOutOfMemoryError</span>
<span class="token parameter variable">-XX:HeapDumpPath</span><span class="token operator">=</span>./java_pid<span class="token operator">&lt;</span>pid<span class="token operator">&gt;</span>.hprof
<span class="token parameter variable">-XX:OnOutOfMemoryError</span><span class="token operator">=</span><span class="token string">&quot;&lt; cmd args &gt;;&lt; cmd args &gt;&quot;</span>
<span class="token parameter variable">-XX:+UseGCOverheadLimit</span>

<span class="token comment"># ----------</span>
<span class="token comment"># HeapDumpOnOutOfMemoryError 指示 JVM 在遇到 OutOfMemoryError 错误时将 heap 转储到物理文件中。</span>

<span class="token comment"># HeapDumpPath 表示要写入文件的路径; 可以给出任何文件名; 但是，如果 JVM 在名称中找到一个 &lt;pid&gt; 标记，则当前进程的进程 id 将附加到文件名中，并使用.hprof格式</span>

<span class="token comment"># OnOutOfMemoryError 用于发出紧急命令，以便在内存不足的情况下执行; 应该在 cmd args 空间中使用适当的命令。例如，如果我们想在内存不足时重启服务器，我们可以设置参数: -XX:OnOutOfMemoryError=&quot;shutdown -r&quot; 。</span>

<span class="token comment"># UseGCOverheadLimit 是一种策略，它限制在抛出 OutOfMemory 错误之前在 GC 中花费的 VM 时间的比例</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,19)]))}const d=e(l,[["render",r],["__file","jvm004.html.vue"]]);export{d as default};
