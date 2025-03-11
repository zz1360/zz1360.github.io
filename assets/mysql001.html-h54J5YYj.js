import{_ as s,c as a,o as e,a as p}from"./app-DukR-6js.js";const t={};function o(c,n){return e(),a("div",null,n[0]||(n[0]=[p(`<h3 id="jpa-级联更新去孤子" tabindex="-1"><a class="header-anchor" href="#jpa-级联更新去孤子" aria-hidden="true">#</a> JPA 级联更新去孤子</h3><p>在使用JPA(hibernate)配置实体关系中，经常会遇到通过父实体对象级联批量更新子对象的需求，而且每次更新必须采用合并方式，即原来的所有子删除，只保留本次保存的所有子实体对象。</p><p>例子：</p><p>A为父对象，持有一个B的集合，A与B的关系为oneToMany.</p><p>第一次保存：设置A下的B集合成员为：1,2,3, 保存A后，B对象对应的数据表为:1,2,3</p><p>第二次保存：设置A下的B集合成员为：2,3,4, 保存A后，B对象对应的数据表为:2,3,4 (自动删除无效数据1)</p><p>这个就是自动去孤子功能。</p><p>配置如下：</p><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">class</span> <span class="token class-name">A</span><span class="token punctuation">{</span>  
  
    <span class="token keyword">private</span> <span class="token class-name">List</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">B</span><span class="token punctuation">&gt;</span></span> bs<span class="token punctuation">;</span>  
  	<span class="token comment">/*
  	 *	orphanRemoval=true配置表明删除无关联的数据。级联更新子结果集时此配置最关键
　　 */</span>
    <span class="token annotation punctuation">@OneToMany</span><span class="token punctuation">(</span>cascade <span class="token operator">=</span> <span class="token class-name">CascadeType</span><span class="token punctuation">.</span><span class="token constant">ALL</span><span class="token punctuation">,</span> mappedBy <span class="token operator">=</span> <span class="token string">&quot;b&quot;</span><span class="token punctuation">,</span> orphanRemoval <span class="token operator">=</span> <span class="token boolean">true</span><span class="token punctuation">)</span>  
    <span class="token annotation punctuation">@OrderBy</span><span class="token punctuation">(</span>clause <span class="token operator">=</span> <span class="token string">&quot;id&quot;</span><span class="token punctuation">)</span>  
    <span class="token keyword">public</span> <span class="token class-name">List</span><span class="token generics"><span class="token punctuation">&lt;</span><span class="token class-name">B</span><span class="token punctuation">&gt;</span></span> <span class="token function">getBs</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>  
        <span class="token keyword">return</span> bs<span class="token punctuation">;</span>  
    <span class="token punctuation">}</span>  
<span class="token punctuation">}</span>
<span class="token comment">/*
同时在操作A对象时一定要注意bs的引用不能改变，具体例子如下：

假如改变后的列表放在 private List&lt;B&gt; bs_new中

A a=dao.findbyId(id);

a.getBs.clear();

a.getBs.addAll(bs_new);

如果用类似a.setBS(bs_new)；这种方式会报错，因为bs属性的引用已经发生了变化。
简单说就是a中的bs对象从数据库查出来之后原本指向somewhere，这时候不能用set方法让它指向一个新的引用地址。
*/</span>

<span class="token comment">//以Employee和Phone举例子，一个Employee对应多个Phone</span>
<span class="token class-name">Employee</span> employee<span class="token operator">=</span>employeeService<span class="token punctuation">.</span><span class="token function">query</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
employee<span class="token punctuation">.</span><span class="token function">getPhones</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">clear</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token class-name">Phone</span> phone1<span class="token operator">=</span><span class="token keyword">new</span> <span class="token class-name">Phone</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
phone1<span class="token punctuation">.</span><span class="token function">setPhoneNumber</span><span class="token punctuation">(</span><span class="token number">132567</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
employee<span class="token punctuation">.</span><span class="token function">getPhones</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>phone1<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token class-name">Phone</span> phone2<span class="token operator">=</span><span class="token keyword">new</span> <span class="token class-name">Phone</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
phone2<span class="token punctuation">.</span><span class="token function">setPhoneNumber</span><span class="token punctuation">(</span><span class="token number">132567</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
employee<span class="token punctuation">.</span><span class="token function">getPhones</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>phone2<span class="token punctuation">)</span><span class="token punctuation">;</span>
employeeService<span class="token punctuation">.</span><span class="token function">update</span><span class="token punctuation">(</span>employee<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,9)]))}const i=s(t,[["render",o],["__file","mysql001.html.vue"]]);export{i as default};
