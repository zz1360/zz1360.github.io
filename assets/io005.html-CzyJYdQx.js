import{_ as o,c,o as n,a}from"./app-DukR-6js.js";const d={};function l(t,e){return n(),c("div",null,e[0]||(e[0]=[a(`<h2 id="核心组件" tabindex="-1"><a class="header-anchor" href="#核心组件" aria-hidden="true">#</a> 核心组件</h2><p><strong>Buffer（缓冲区）</strong>：NIO 读写数据都是通过缓冲区进行操作的。读操作的时候将 Channel 中的数据填充到 Buffer 中，而写操作时将 Buffer 中的数据写入到 Channel 中。</p><p><strong>Channel（通道）</strong>：Channel 是一个双向的、可读可写的数据传输通道，NIO 通过 Channel 来实现数据的输入输出。通道是一个抽象的概念，它可以代表文件、套接字或者其他数据源之间的连接。</p><p><strong>Selector（选择器）</strong>：允许一个线程处理多个 Channel，基于事件驱动的 I/O 多路复用模型。所有的 Channel 都可以注册到 Selector 上，由 Selector 来分配线程来处理事件。</p><h3 id="buffer-缓冲区" tabindex="-1"><a class="header-anchor" href="#buffer-缓冲区" aria-hidden="true">#</a> Buffer（缓冲区）</h3><p>在传统的 BIO 中，数据的读写是面向流的， 分为字节流和字符流。</p><p>在 Java 1.4 的 NIO 库中，所有数据都是用缓冲区处理的，这是新库和之前的 BIO 的一个重要区别，有点类似于 BIO 中的缓冲流。NIO 在读取数据时，它是直接读到缓冲区中的。在写入数据时，写入到缓冲区中。 使用 NIO 在读写数据时，都是通过缓冲区进行操作。</p><p><code>Buffer</code> 的有很多子类。其中，最常用的是 <code>ByteBuffer</code>，它可以用来存储和操作字节数据。你可以将 Buffer 理解为一个数组，<code>IntBuffer</code>、<code>FloatBuffer</code>、<code>CharBuffer</code> 等分别对应 <code>int[]</code>、<code>float[]</code>、<code>char[]</code> 等。</p><p><code>Buffer</code> 类中定义的四个成员变量：</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">public</span> <span class="token keyword">abstract</span> <span class="token keyword">class</span> <span class="token class-name">Buffer</span> <span class="token punctuation">{</span>
    <span class="token comment">// Invariants: mark &lt;= position &lt;= limit &lt;= capacity</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> mark <span class="token operator">=</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> position <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> limit<span class="token punctuation">;</span>
    <span class="token keyword">private</span> <span class="token keyword">int</span> capacity<span class="token punctuation">;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>容量（<code>capacity</code>）：<code>Buffer</code>可以存储的最大数据量，<code>Buffer</code>创建时设置且不可改变；</p><p>界限（<code>limit</code>）：<code>Buffer</code> 中可以读/写数据的边界。写模式下，<code>limit</code> 代表最多能写入的数据，一般等于 <code>capacity</code>（可以通过<code>limit(int newLimit)</code>方法设置）；读模式下，<code>limit</code> 等于 Buffer 中实际写入的数据大小。</p><p>位置（<code>position</code>）：下一个可以被读写的数据的位置（索引）。从写操作模式到读操作模式切换的时候（flip），<code>position</code> 都会归零，这样就可以从头开始读写了。</p><p>标记（<code>mark</code>）：<code>Buffer</code>允许将位置直接定位到该标记处，这是一个可选属性；</p><p>另外，Buffer 有读模式和写模式这两种模式，分别用于从 Buffer 中读取数据或者向 Buffer 中写入数据。Buffer 被创建之后默认是写模式，调用 <code>flip()</code> 可以切换到读模式。如果要再次切换回写模式，可以调用 <code>clear()</code> 或者 <code>compact()</code> 方法。</p><h3 id="channel-通道" tabindex="-1"><a class="header-anchor" href="#channel-通道" aria-hidden="true">#</a> Channel（通道）</h3><p>Channel 是一个通道，它建立了与数据源（如文件、网络套接字等）之间的连接。我们可以利用它来读取和写入数据，就像打开了一条自来水管，让数据在 Channel 中自由流动。</p><p>BIO 中的流是单向的，分为各种 <code>InputStream</code>（输入流）和 <code>OutputStream</code>（输出流），数据只是在一个方向上传输。通道与流的不同之处在于通道是双向的，它可以用于读、写或者同时用于读写。</p><p>Channel 与前面介绍的 Buffer 打交道，读操作的时候将 Channel 中的数据填充到 Buffer 中，而写操作时将 Buffer 中的数据写入到 Channel 中。</p><p>另外，因为 Channel 是全双工的，所以它可以比流更好地映射底层操作系统的 API。特别是在 UNIX 网络编程模型中，底层操作系统的通道都是全双工的，同时支持读写操作。</p><p>其中，最常用的是以下几种类型的通道：</p><ul><li><code>FileChannel</code>：文件访问通道；</li><li><code>SocketChannel</code>、<code>ServerSocketChannel</code>：TCP 通信通道；</li><li><code>DatagramChannel</code>：UDP 通信通道；</li></ul><p>Channel 最核心的两个方法：</p><ol><li><code>read</code> ：读取数据并写入到 Buffer 中。</li><li><code>write</code> ：将 Buffer 中的数据写入到 Channel 中。</li></ol><h3 id="selector-选择器" tabindex="-1"><a class="header-anchor" href="#selector-选择器" aria-hidden="true">#</a> Selector（选择器）</h3><p>Selector（选择器） 是 NIO 中的一个关键组件，它允许一个线程处理多个 Channel。Selector 是基于事件驱动的 I/O 多路复用模型，主要运作原理是：通过 Selector 注册通道的事件，Selector 会不断地轮询注册在其上的 Channel。当事件发生时，比如：某个 Channel 上面有新的 TCP 连接接入、读和写事件，这个 Channel 就处于就绪状态，会被 Selector 轮询出来。Selector 会将相关的 Channel 加入到就绪集合中。通过 SelectionKey 可以获取就绪 Channel 的集合，然后对这些就绪的 Channel 进行相应的 I/O 操作。</p><p>一个多路复用器 Selector 可以同时轮询多个 Channel，由于 JDK 使用了 <code>epoll()</code> 代替传统的 <code>select</code> 实现，所以它并没有最大连接句柄 <code>1024/2048</code> 的限制。这也就意味着只需要一个线程负责 Selector 的轮询，就可以接入成千上万的客户端。</p><p>Selector 可以监听以下四种事件类型：</p><ol><li><code>SelectionKey.OP_ACCEPT</code>：表示通道接受连接的事件，这通常用于 <code>ServerSocketChannel</code>。</li><li><code>SelectionKey.OP_CONNECT</code>：表示通道完成连接的事件，这通常用于 <code>SocketChannel</code>。</li><li><code>SelectionKey.OP_READ</code>：表示通道准备好进行读取的事件，即有数据可读。</li><li><code>SelectionKey.OP_WRITE</code>：表示通道准备好进行写入的事件，即可以写入数据。</li></ol><p><code>Selector</code>是抽象类，可以通过调用此类的 <code>open()</code> 静态方法来创建 Selector 实例。Selector 可以同时监控多个 <code>SelectableChannel</code> 的 <code>IO</code> 状况，是非阻塞 <code>IO</code> 的核心。</p><p>一个 Selector 实例有三个 <code>SelectionKey</code> 集合：</p><ol><li>所有的 <code>SelectionKey</code> 集合：代表了注册在该 Selector 上的 <code>Channel</code>，这个集合可以通过 <code>keys()</code> 方法返回。</li><li>被选择的 <code>SelectionKey</code> 集合：代表了所有可通过 <code>select()</code> 方法获取的、需要进行 <code>IO</code> 处理的 Channel，这个集合可以通过 <code>selectedKeys()</code> 返回。</li><li>被取消的 <code>SelectionKey</code> 集合：代表了所有被取消注册关系的 <code>Channel</code>，在下一次执行 <code>select()</code> 方法时，这些 <code>Channel</code> 对应的 <code>SelectionKey</code> 会被彻底删除，程序通常无须直接访问该集合，也没有暴露访问的方法。</li></ol><p>Selector 还提供了一系列和 <code>select()</code> 相关的方法：</p><ul><li><code>int select()</code>：监控所有注册的 <code>Channel</code>，当它们中间有需要处理的 <code>IO</code> 操作时，该方法返回，并将对应的 <code>SelectionKey</code> 加入被选择的 <code>SelectionKey</code> 集合中，该方法返回这些 <code>Channel</code> 的数量。</li><li><code>int select(long timeout)</code>：可以设置超时时长的 <code>select()</code> 操作。</li><li><code>int selectNow()</code>：执行一个立即返回的 <code>select()</code> 操作，相对于无参数的 <code>select()</code> 方法而言，该方法不会阻塞线程。</li><li><code>Selector wakeup()</code>：使一个还未返回的 <code>select()</code> 方法立刻返回。</li><li>……</li></ul>`,34)]))}const i=o(d,[["render",l],["__file","io005.html.vue"]]);export{i as default};
