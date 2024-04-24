import{_ as e,o as a,c as i,d as s}from"./app-2hhlzFPm.js";const d={},n=s(`<h2 id="为什么引入泛型-why-use-generics" tabindex="-1"><a class="header-anchor" href="#为什么引入泛型-why-use-generics" aria-hidden="true">#</a> 为什么引入泛型 Why Use Generics?</h2><p>减少重复代码，增加复用</p><h2 id="泛型类-generic-classes" tabindex="-1"><a class="header-anchor" href="#泛型类-generic-classes" aria-hidden="true">#</a> 泛型类 Generic Classes</h2><div class="language-Java line-numbers-mode" data-ext="Java"><pre class="language-Java"><code>public class Test {}

public class Test&lt;T&gt; {}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="类型参数的约束-bounded-type-parameters" tabindex="-1"><a class="header-anchor" href="#类型参数的约束-bounded-type-parameters" aria-hidden="true">#</a> 类型参数的约束 Bounded Type Parameters</h2><div class="language-Java line-numbers-mode" data-ext="Java"><pre class="language-Java"><code>//Vehicle是一个类，Thing是一个接口，类必须在前，接口在后
public class Test&lt;T extends Vehicle &amp; Thing&gt; {}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="类型安全-type-safe" tabindex="-1"><a class="header-anchor" href="#类型安全-type-safe" aria-hidden="true">#</a> 类型安全 Type-safe</h2><p>如果给一个list设置泛型为Object，可能会导致类型安全问题，强烈不建议</p><h2 id="泛型方法-generic-methods" tabindex="-1"><a class="header-anchor" href="#泛型方法-generic-methods" aria-hidden="true">#</a> 泛型方法 Generic Methods</h2><div class="language-Java line-numbers-mode" data-ext="Java"><pre class="language-Java"><code>public void test(){}

public &lt;T&gt; void test()

public &lt;T extends Vehicle&gt; void test()
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="通配符-wildcard" tabindex="-1"><a class="header-anchor" href="#通配符-wildcard" aria-hidden="true">#</a> 通配符 Wildcard</h2><div class="language-Java line-numbers-mode" data-ext="Java"><pre class="language-Java"><code>public &lt;T extends Vehicle&gt; void test(List&lt;T&gt; list)

public void test(List&lt;?&gt; list)

public void test(List&lt;? extends Vehicle&gt; list)

# Car是Vehicle的子类，suer代表?必须是Car的父类或者就是Car
public void test(List&lt;? super Car&gt; list)
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="静态泛型方法" tabindex="-1"><a class="header-anchor" href="#静态泛型方法" aria-hidden="true">#</a> 静态泛型方法</h3><p><code>public static &lt; E &gt; void printArray( E[] inputArray ) </code>一般被称为静态泛型方法;在 java 中泛型只是一个占位符，必须在传递类型后才能使用。 类在实例化时才能真正的传递类型参数，由于静态方法的加载先于类的实例化，也就是说类中的泛型还没有传递真正的类型参数，静态的方法的加载就已经完成了， 所以静态泛型方法是没有办法使用类上声明的泛型的。只能使用自己声明的 <code>&lt;E&gt;</code></p>`,14),l=[n];function r(t,c){return a(),i("div",null,l)}const u=e(d,[["render",r],["__file","fanxing.html.vue"]]);export{u as default};
