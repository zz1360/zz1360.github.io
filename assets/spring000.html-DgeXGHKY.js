import{_ as n,c as t,o as a,a as o}from"./app-DukR-6js.js";const r={};function i(s,e){return a(),t("div",null,e[0]||(e[0]=[o(`<h2 id="注解" tabindex="-1"><a class="header-anchor" href="#注解" aria-hidden="true">#</a> 注解</h2><h3 id="autowired-和-resource-的区别是什么" tabindex="-1"><a class="header-anchor" href="#autowired-和-resource-的区别是什么" aria-hidden="true">#</a> @Autowired 和 @Resource 的区别是什么？</h3><ul><li><code>@Autowired</code> 是 Spring 提供的注解，<code>@Resource</code> 是 JDK 提供的注解。</li><li><code>Autowired</code> 默认的注入方式为<code>byType</code>（根据类型进行匹配），<code>@Resource</code>默认注入方式为 <code>byName</code>（根据名称进行匹配）。</li><li>当一个接口存在多个实现类的情况下，<code>@Autowired</code> 和<code>@Resource</code>都需要通过名称才能正确匹配到对应的 Bean。<code>Autowired</code> 可以通过 <code>@Qualifier</code> 注解来显式指定名称，<code>@Resource</code>可以通过 <code>name</code> 属性来显式指定名称。</li><li><code>@Autowired</code> 支持在构造函数、方法、字段和参数上使用。<code>@Resource</code> 主要用于字段和方法上的注入，不支持在构造函数或参数上使用。</li></ul><h3 id="指定bean的作用域" tabindex="-1"><a class="header-anchor" href="#指定bean的作用域" aria-hidden="true">#</a> 指定Bean的作用域</h3><p>@Bean和@Scope配合使用</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token annotation punctuation">@Bean</span>
<span class="token annotation punctuation">@Scope</span><span class="token punctuation">(</span>value <span class="token operator">=</span> <span class="token class-name">ConfigurableBeanFactory</span><span class="token punctuation">.</span><span class="token constant">SCOPE_PROTOTYPE</span><span class="token punctuation">)</span>
<span class="token keyword">public</span> <span class="token class-name">Person</span> <span class="token function">personPrototype</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token keyword">new</span> <span class="token class-name">Person</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="bean" tabindex="-1"><a class="header-anchor" href="#bean" aria-hidden="true">#</a> Bean</h2><h3 id="单例模式下线程是否安全" tabindex="-1"><a class="header-anchor" href="#单例模式下线程是否安全" aria-hidden="true">#</a> 单例模式下线程是否安全</h3><p>singleton 作用域下，IoC 容器中只有唯一的 bean 实例，可能会存在资源竞争问题（取决于 Bean 是否有状态）。如果这个 bean 是有状态的话，那就存在线程安全问题（有状态 Bean 是指包含可变的成员变量的对象）。</p><p>不过，大部分 Bean 实际都是无状态（没有定义可变的成员变量）的（比如 Dao、Service），这种情况下， Bean 是线程安全的。</p><p>对于有状态单例 Bean 的线程安全问题，常见的有两种解决办法：</p><ol><li>在 Bean 中尽量避免定义可变的成员变量。</li><li>在类中定义一个 <code>ThreadLocal</code> 成员变量，将需要的可变成员变量保存在 <code>ThreadLocal</code> 中（推荐的一种方式）。</li></ol><h3 id="生命周期" tabindex="-1"><a class="header-anchor" href="#生命周期" aria-hidden="true">#</a> 生命周期</h3><p>待补充图片</p><h2 id="aop" tabindex="-1"><a class="header-anchor" href="#aop" aria-hidden="true">#</a> AOP</h2><p>AOP(Aspect-Oriented Programming:面向切面编程)能够将那些与业务无关，却为业务模块所共同调用的逻辑或责任（例如事务处理、日志管理、权限控制等）封装起来，便于减少系统的重复代码，降低模块间的耦合度，并有利于未来的可拓展性和可维护性。</p><p>Spring AOP 就是基于动态代理的，如果要代理的对象，实现了某个接口，那么 Spring AOP 会使用 <strong>JDK Proxy</strong>，去创建代理对象，而对于没有实现接口的对象，就无法使用 JDK Proxy 去进行代理了，这时候 Spring AOP 会使用 <strong>Cglib</strong> 生成一个被代理对象的子类来作为代理。</p><p>AOP 切面编程涉及到的一些专业术语：</p><table><thead><tr><th style="text-align:left;">术语</th><th style="text-align:center;">含义</th></tr></thead><tbody><tr><td style="text-align:left;">目标(Target)</td><td style="text-align:center;">被通知的对象</td></tr><tr><td style="text-align:left;">代理(Proxy)</td><td style="text-align:center;">向目标对象应用通知之后创建的代理对象</td></tr><tr><td style="text-align:left;">连接点(JoinPoint)</td><td style="text-align:center;">目标对象的所属类中，定义的所有方法均为连接点</td></tr><tr><td style="text-align:left;">切入点(Pointcut)</td><td style="text-align:center;">被切面拦截 / 增强的连接点（切入点一定是连接点，连接点不一定是切入点）</td></tr><tr><td style="text-align:left;">通知(Advice)</td><td style="text-align:center;">增强的逻辑 / 代码，也即拦截到目标对象的连接点之后要做的事情</td></tr><tr><td style="text-align:left;">切面(Aspect)</td><td style="text-align:center;">切入点(Pointcut)+通知(Advice)</td></tr><tr><td style="text-align:left;">Weaving(织入)</td><td style="text-align:center;">将通知应用到目标对象，进而生成代理对象的过程动作</td></tr></tbody></table><h3 id="spring-aop-和-aspectj-aop-有什么区别" tabindex="-1"><a class="header-anchor" href="#spring-aop-和-aspectj-aop-有什么区别" aria-hidden="true">#</a> Spring AOP 和 AspectJ AOP 有什么区别？</h3><p><strong>Spring AOP 属于运行时增强，而 AspectJ 是编译时增强。</strong> Spring AOP 基于代理(Proxying)，而 AspectJ 基于字节码操作(Bytecode Manipulation)。</p><p>Spring AOP 已经集成了 AspectJ ，AspectJ 应该算的上是 Java 生态系统中最完整的 AOP 框架了。AspectJ 相比于 Spring AOP 功能更加强大，但是 Spring AOP 相对来说更简单，</p><p>如果我们的切面比较少，那么两者性能差异不大。但是，当切面太多的话，最好选择 AspectJ ，它比 Spring AOP 快很多。</p><h3 id="aspectj-定义的通知类型有哪些" tabindex="-1"><a class="header-anchor" href="#aspectj-定义的通知类型有哪些" aria-hidden="true">#</a> AspectJ 定义的通知类型有哪些？</h3><ul><li><strong>Before</strong>（前置通知）：目标对象的方法调用之前触发</li><li><strong>After</strong> （后置通知）：目标对象的方法调用之后触发</li><li><strong>AfterReturning</strong>（返回通知）：目标对象的方法调用完成，在返回结果值之后触发</li><li><strong>AfterThrowing</strong>（异常通知）：目标对象的方法运行中抛出 / 触发异常后触发。AfterReturning 和 AfterThrowing 两者互斥。如果方法调用成功无异常，则会有返回值；如果方法抛出了异常，则不会有返回值。</li><li><strong>Around</strong> （环绕通知）：编程式控制目标对象的方法调用。环绕通知是所有通知类型中可操作范围最大的一种，因为它可以直接拿到目标对象，以及要执行的方法，所以环绕通知可以任意的在目标对象的方法调用前后搞事，甚至不调用目标对象的方法</li></ul><h2 id="spring中的循环依赖问题" tabindex="-1"><a class="header-anchor" href="#spring中的循环依赖问题" aria-hidden="true">#</a> Spring中的循环依赖问题</h2><p>循环依赖是指 Bean 对象循环引用，是两个或多个 Bean 之间相互持有对方的引用。</p><p>Spring 框架通过使用三级缓存来解决这个问题，确保即使在循环依赖的情况下也能正确创建 Bean。</p><p>Spring 的三级缓存包括：</p><ol><li><strong>一级缓存（singletonObjects）</strong>：存放最终形态的 Bean（已经实例化、属性填充、初始化），单例池，为“Spring 的单例属性”⽽⽣。一般情况我们获取 Bean 都是从这里获取的，但是并不是所有的 Bean 都在单例池里面，例如原型 Bean 就不在里面。</li><li><strong>二级缓存（earlySingletonObjects）</strong>：存放过渡 Bean（半成品，尚未属性填充），也就是三级缓存中<code>ObjectFactory</code>产生的对象，与三级缓存配合使用的，可以防止 AOP 的情况下，每次调用<code>ObjectFactory#getObject()</code>都是会产生新的代理对象的。</li><li><strong>三级缓存（singletonFactories）</strong>：存放<code>ObjectFactory</code>，<code>ObjectFactory</code>的<code>getObject()</code>方法（最终调用的是<code>getEarlyBeanReference()</code>方法）可以生成原始 Bean 对象或者代理对象（如果 Bean 被 AOP 切面代理）。三级缓存只会对单例 Bean 生效。</li></ol><p>Spring 创建 Bean 的流程：</p><ol><li>先去 <strong>一级缓存 <code>singletonObjects</code></strong> 中获取，存在就返回；</li><li>如果不存在或者对象正在创建中，于是去 <strong>二级缓存 <code>earlySingletonObjects</code></strong> 中获取；</li><li>如果还没有获取到，就去 <strong>三级缓存 <code>singletonFactories</code></strong> 中获取，通过执行 <code>ObjectFacotry</code> 的 <code>getObject()</code> 就可以获取该对象，获取成功之后，从三级缓存移除，并将该对象加入到二级缓存中。</li></ol><p>整个解决循环依赖的流程如下：</p><ul><li>当 Spring 创建 A 之后，发现 A 依赖了 B ，又去创建 B，B 依赖了 A ，又去创建 A；</li><li>在 B 创建 A 的时候，那么此时 A 就发生了循环依赖，由于 A 此时还没有初始化完成，因此在 <strong>一二级缓存</strong> 中肯定没有 A；</li><li>那么此时就去三级缓存中调用 <code>getObject()</code> 方法去获取 A 的 <strong>前期暴露的对象</strong> ，也就是调用上边加入的 <code>getEarlyBeanReference()</code> 方法，生成一个 A 的 <strong>前期暴露对象</strong>；</li><li>然后就将这个 <code>ObjectFactory</code> 从三级缓存中移除，并且将前期暴露对象放入到二级缓存中，那么 B 就将这个前期暴露对象注入到依赖，来支持循环依赖。</li></ul><p><strong>缺点</strong>：少部分情况是不支持循环依赖的，比如非单例的 bean 和<code>@Async</code>注解的 bean 无法支持循环依赖。</p><h3 id="lazy-能解决循环依赖吗" tabindex="-1"><a class="header-anchor" href="#lazy-能解决循环依赖吗" aria-hidden="true">#</a> @Lazy 能解决循环依赖吗？</h3><p>如非必要，尽量不要用全局懒加载。全局懒加载会让 Bean 第一次使用的时候加载会变慢，并且它会延迟应用程序问题的发现（当 Bean 被初始化时，问题才会出现）。</p><p>如果一个 Bean 没有被标记为懒加载，那么它会在 Spring IoC 容器启动的过程中被创建和初始化。如果一个 Bean 被标记为懒加载，那么它不会在 Spring IoC 容器启动时立即实例化，而是在第一次被请求时才创建。这可以帮助减少应用启动时的初始化时间，也可以用来解决循环依赖问题。</p><p>循环依赖问题是如何通过<code>@Lazy</code> 解决的呢？这里举一个例子，比如说有两个 Bean，A 和 B，他们之间发生了循环依赖，那么 A 的构造器上添加 <code>@Lazy</code> 注解之后（延迟 Bean B 的实例化），加载的流程如下：</p><ul><li>首先 Spring 会去创建 A 的 Bean，创建时需要注入 B 的属性；</li><li>由于在 A 上标注了 <code>@Lazy</code> 注解，因此 Spring 会去创建一个 B 的代理对象，将这个代理对象注入到 A 中的 B 属性；</li><li>之后开始执行 B 的实例化、初始化，在注入 B 中的 A 属性时，此时 A 已经创建完毕了，就可以将 A 给注入进去。</li></ul><p>通过 <code>@Lazy</code> 就解决了循环依赖的注入， 关键点就在于对 A 中的属性 B 进行注入时，注入的是 B 的代理对象，因此不会循环依赖。</p><p>之前说的发生循环依赖是因为在对 A 中的属性 B 进行注入时，注入的是 B 对象，此时又会去初始化 B 对象，发现 B 又依赖了 A，因此才导致的循环依赖。</p><p>一般是不建议使用循环依赖的，但是如果项目比较复杂，可以使用 <code>@Lazy</code> 解决一部分循环依赖的问题。</p><h2 id="spring事务" tabindex="-1"><a class="header-anchor" href="#spring事务" aria-hidden="true">#</a> Spring事务</h2><h3 id="spring管理事务的方式" tabindex="-1"><a class="header-anchor" href="#spring管理事务的方式" aria-hidden="true">#</a> Spring管理事务的方式</h3><ul><li><strong>编程式事务</strong>：在代码中硬编码(在分布式系统中推荐使用) : 通过 <code>TransactionTemplate</code>或者 <code>TransactionManager</code> 手动管理事务，事务范围过大会出现事务未提交导致超时，因此事务要比锁的粒度更小。</li><li><strong>声明式事务</strong>：在 XML 配置文件中配置或者直接基于注解（单体应用或者简单业务系统推荐使用） : 实际是通过 AOP 实现（基于<code>@Transactional</code> 的全注解方式使用最多）</li></ul><h3 id="事务传播行为" tabindex="-1"><a class="header-anchor" href="#事务传播行为" aria-hidden="true">#</a> 事务传播行为</h3><p><strong>事务传播行为是为了解决业务层方法之间互相调用的事务问题</strong>。</p><p>当事务方法被另一个事务方法调用时，必须指定事务应该如何传播。例如：方法可能继续在现有事务中运行，也可能开启一个新事务，并在自己的事务中运行。</p><p>正确的事务传播行为可能的值如下:</p><p><strong>1.<code>TransactionDefinition.PROPAGATION_REQUIRED</code></strong></p><p>使用的最多的一个事务传播行为，我们平时经常使用的<code>@Transactional</code>注解默认使用就是这个事务传播行为。如果当前存在事务，则加入该事务；如果当前没有事务，则创建一个新的事务。</p><p><strong><code>2.TransactionDefinition.PROPAGATION_REQUIRES_NEW</code></strong></p><p>创建一个新的事务，如果当前存在事务，则把当前事务挂起。也就是说不管外部方法是否开启事务，<code>Propagation.REQUIRES_NEW</code>修饰的内部方法会新开启自己的事务，且开启的事务相互独立，互不干扰。</p><p><strong>3.<code>TransactionDefinition.PROPAGATION_NESTED</code></strong></p><p>如果当前存在事务，则创建一个事务作为当前事务的嵌套事务来运行；如果当前没有事务，则该取值等价于<code>TransactionDefinition.PROPAGATION_REQUIRED</code>。</p><p><strong>4.<code>TransactionDefinition.PROPAGATION_MANDATORY</code></strong></p><p>如果当前存在事务，则加入该事务；如果当前没有事务，则抛出异常。（mandatory：强制性）</p><p>这个使用的很少。</p><h3 id="隔离级别" tabindex="-1"><a class="header-anchor" href="#隔离级别" aria-hidden="true">#</a> 隔离级别</h3><ul><li><strong><code>TransactionDefinition.ISOLATION_DEFAULT</code></strong> :使用后端数据库默认的隔离级别，MySQL 默认采用的 <code>REPEATABLE_READ</code> 隔离级别 Oracle 默认采用的 <code>READ_COMMITTED</code> 隔离级别.</li><li><strong><code>TransactionDefinition.ISOLATION_READ_UNCOMMITTED</code></strong> :最低的隔离级别，使用这个隔离级别很少，因为它允许读取尚未提交的数据变更，<strong>可能会导致脏读、幻读或不可重复读</strong></li><li><strong><code>TransactionDefinition.ISOLATION_READ_COMMITTED</code></strong> : 允许读取并发事务已经提交的数据，<strong>可以阻止脏读，但是幻读或不可重复读仍有可能发生</strong></li><li><strong><code>TransactionDefinition.ISOLATION_REPEATABLE_READ</code></strong> : 对同一字段的多次读取结果都是一致的，除非数据是被本身事务自己所修改，<strong>可以阻止脏读和不可重复读，但幻读仍有可能发生。</strong></li><li><strong><code>TransactionDefinition.ISOLATION_SERIALIZABLE</code></strong> : 最高的隔离级别，完全服从 ACID 的隔离级别。所有的事务依次逐个执行，这样事务之间就完全不可能产生干扰，也就是说，<strong>该级别可以防止脏读、不可重复读以及幻读</strong>。但是这将严重影响程序的性能。通常情况下也不会用到该级别。</li></ul>`,61)]))}const d=n(r,[["render",i],["__file","spring000.html.vue"]]);export{d as default};
