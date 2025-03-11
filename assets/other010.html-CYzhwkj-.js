import{_ as r,c as i,o as l,a}from"./app-DukR-6js.js";const t={};function n(o,e){return l(),i("div",null,e[0]||(e[0]=[a('<ul><li>我之前在实际项目就遇到过类似的问题，整个网站无法正常处理请求，服务器负载直接快被拉满。后面发现原因是项目超时设置错误加上客户端请求处理异常，导致服务端连接数直接接近 40w+，这么多堆积的连接直接把系统干趴了。</li><li></li></ul><h3 id="如何设置超时时间" tabindex="-1"><a class="header-anchor" href="#如何设置超时时间" aria-hidden="true">#</a> 如何设置超时时间</h3><p>通常情况下，我们建议读取超时设置为 <strong>1500ms</strong> ,这是一个比较普适的值。如果你的系统或者服务对于延迟比较敏感的话，那读取超时值可以适当在 <strong>1500ms</strong> 的基础上进行缩短。反之，读取超时值也可以在 <strong>1500ms</strong> 的基础上进行加长，不过，尽量还是不要超过 <strong>1500ms</strong> 。连接超时可以适当设置长一些，建议在 <strong>1000ms ~ 5000ms</strong> 之内。</p><p>没有银弹！超时值具体该设置多大，还是要根据实际项目的需求和情况慢慢调整优化得到。</p><p>我们也可以将超时弄成可配置化的参数而不是固定的，比较简单的一种办法就是将超时的值放在配置中心中。这样的话，我们就可以根据系统或者服务的状态动态调整超时值了。</p><h3 id="重试次数如何设置" tabindex="-1"><a class="header-anchor" href="#重试次数如何设置" aria-hidden="true">#</a> 重试次数如何设置</h3><p>重试的次数通常建议设为 3 次。大部分情况下，我们还是更建议使用梯度间隔重试策略，比如说我们要重试 3 次的话，第 1 次请求失败后，等待 1 秒再进行重试，第 2 次请求失败后，等待 2 秒再进行重试，第 3 次请求失败后，等待 3 秒再进行重试。</p><p>一般不建议自己动手实现，有很多第三方开源库提供了更完善的重试机制实现，例如 Spring Retry、Resilience4j、Guava Retrying。</p><h3 id="吞吐量" tabindex="-1"><a class="header-anchor" href="#吞吐量" aria-hidden="true">#</a> 吞吐量</h3><p>吞吐量指的是系统单位时间内系统处理的请求数量。衡量吞吐量有几个重要的参数：QPS（TPS）、并发数、响应时间。</p><ol><li>QPS（Query Per Second）：服务器每秒可以执行的查询次数；</li><li>TPS（Transaction Per Second）：服务器每秒处理的事务数（这里的一个事务可以理解为客户发出请求到收到服务器的过程）；</li><li>并发数；系统能同时处理请求的数目即同时提交请求的用户数目。</li><li>响应时间：一般取多次请求的平均响应时间</li></ol><p>理清他们的概念，就很容易搞清楚他们之间的关系了。</p><ul><li><strong>QPS（TPS）</strong> = 并发数/平均响应时间</li><li><strong>并发数</strong> = QPS*平均响应时间</li></ul><p>书中是这样描述 QPS 和 TPS 的区别的。</p><blockquote><p>QPS vs TPS：QPS 基本类似于 TPS，但是不同的是，对于一个页面的一次访问，形成一个 TPS；但一次页面请求，可能产生多次对服务器的请求，服务器对这些请求，就可计入“QPS”之中。如，访问一个页面会请求服务器 2 次，一次访问，产生一个“T”，产生 2 个“Q”。</p></blockquote><h3 id="常见性能优化策略" tabindex="-1"><a class="header-anchor" href="#常见性能优化策略" aria-hidden="true">#</a> 常见性能优化策略</h3><p>下面是一些性能优化时，我经常拿来自问的一些问题：</p><ol><li>系统是否需要缓存？</li><li>系统架构本身是不是就有问题？</li><li>系统是否有用到锁，如果有，有没有可能存在死锁的地方？</li><li>系统是否存在内存泄漏？（Java 的自动回收内存虽然很方便，但是，有时候代码写的不好真的会造成内存泄漏）</li><li>数据库索引使用是否合理？</li></ol>',18)]))}const d=r(t,[["render",n],["__file","other010.html.vue"]]);export{d as default};
