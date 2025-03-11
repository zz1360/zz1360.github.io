import{_ as i,c as l,o as a,a as n}from"./app-DukR-6js.js";const t={};function s(r,e){return a(),l("div",null,e[0]||(e[0]=[n(`<h2 id="使用optional的意义所在" tabindex="-1"><a class="header-anchor" href="#使用optional的意义所在" aria-hidden="true">#</a> 使用optional的意义所在</h2><p>Optional普遍用于方法的返回类型，表示方法可能不返回结果。当你有一个方法可能返回一个值，或者什么都不返回，即返回null时，你可以使用optional。 比方说你设计一个api的时候，它能引导api的使用者知道这个结果可能不存在，并强制调用者处理这种可能性，可以减少错误的发生。</p><h2 id="不推荐的使用场景" tabindex="-1"><a class="header-anchor" href="#不推荐的使用场景" aria-hidden="true">#</a> 不推荐的使用场景</h2><ul><li>不应该用于类的字段 <ul><li>会增加内存消耗，并且会使得对象的序列化变得复杂</li></ul></li><li>也不应该用作方法的参数 <ul><li>会使方法的使用和理解变得复杂。如果你希望方法可以接受一个可能为空的值，通常由更好的设计选择，比如方法重载</li></ul></li><li>不应该用于构造函数参数。类似于方法参数，应该通过构造器重载来解决。</li><li>不应该用于集合的参数类型，如<code>Optional&lt;List&lt;User&gt;&gt;</code>,集合已经有很好的处理好空集合的情况,如下所示代码，没必要用Optional包装集合</li></ul><div class="language-Java line-numbers-mode" data-ext="Java"><pre class="language-Java"><code>public List&lt;User&gt; getUser() {
    if(getList() == null) {
        return Collections.emptyList();
    } else {
        return getList();
    }
}
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ul><li>不建议使用get方法。即使使用ifPresent和get的组合也不是一个好的选择。这样跟直接用if else判断值是否为空没有本质区别。应该使用ifPresentOrElse或者orElseThrow等方法。</li></ul>`,6)]))}const o=i(t,[["render",s],["__file","feature003.html.vue"]]);export{o as default};
