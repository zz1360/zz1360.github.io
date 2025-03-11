import{_ as s,c as a,o as e,a as p}from"./app-DukR-6js.js";const t={};function c(o,n){return e(),a("div",null,n[0]||(n[0]=[p(`<div class="custom-container warning"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></g></svg><p class="custom-container-title">WARNING</p><p>BigDecimal等值比较用compareTo方法，此方法会忽略掉精度。</p></div><h2 id="工具类" tabindex="-1"><a class="header-anchor" href="#工具类" aria-hidden="true">#</a> 工具类</h2><div class="language-java line-numbers-mode" data-ext="java"><pre class="language-java"><code><span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>math<span class="token punctuation">.</span></span><span class="token class-name">BigDecimal</span></span><span class="token punctuation">;</span>
<span class="token keyword">import</span> <span class="token import"><span class="token namespace">java<span class="token punctuation">.</span>math<span class="token punctuation">.</span></span><span class="token class-name">RoundingMode</span></span><span class="token punctuation">;</span>

<span class="token doc-comment comment">/**
 * 简化BigDecimal计算的小工具类
 */</span>
<span class="token keyword">public</span> <span class="token keyword">class</span> <span class="token class-name">BigDecimalUtil</span> <span class="token punctuation">{</span>

    <span class="token doc-comment comment">/**
     * 默认除法运算精度
     */</span>
    <span class="token keyword">private</span> <span class="token keyword">static</span> <span class="token keyword">final</span> <span class="token keyword">int</span> <span class="token constant">DEF_DIV_SCALE</span> <span class="token operator">=</span> <span class="token number">10</span><span class="token punctuation">;</span>

    <span class="token keyword">private</span> <span class="token class-name">BigDecimalUtil</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供精确的加法运算。
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span> 被加数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span> 加数
     * <span class="token keyword">@return</span> 两个参数的和
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">add</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b1 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> b2 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v2<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b1<span class="token punctuation">.</span><span class="token function">add</span><span class="token punctuation">(</span>b2<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">doubleValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供精确的减法运算。
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span> 被减数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span> 减数
     * <span class="token keyword">@return</span> 两个参数的差
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">subtract</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b1 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> b2 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v2<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b1<span class="token punctuation">.</span><span class="token function">subtract</span><span class="token punctuation">(</span>b2<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">doubleValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供精确的乘法运算。
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span> 被乘数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span> 乘数
     * <span class="token keyword">@return</span> 两个参数的积
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">multiply</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b1 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> b2 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v2<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b1<span class="token punctuation">.</span><span class="token function">multiply</span><span class="token punctuation">(</span>b2<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">doubleValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供（相对）精确的除法运算，当发生除不尽的情况时，精确到
     * 小数点以后10位，以后的数字四舍五入。
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span> 被除数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span> 除数
     * <span class="token keyword">@return</span> 两个参数的商
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">divide</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token function">divide</span><span class="token punctuation">(</span>v1<span class="token punctuation">,</span> v2<span class="token punctuation">,</span> <span class="token constant">DEF_DIV_SCALE</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供（相对）精确的除法运算。当发生除不尽的情况时，由scale参数指
     * 定精度，以后的数字四舍五入。
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span>    被除数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span>    除数
     * <span class="token keyword">@param</span> <span class="token parameter">scale</span> 表示表示需要精确到小数点以后几位。
     * <span class="token keyword">@return</span> 两个参数的商
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">divide</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">,</span> <span class="token keyword">int</span> scale<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>scale <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">IllegalArgumentException</span><span class="token punctuation">(</span>
                    <span class="token string">&quot;The scale must be a positive integer or zero&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token class-name">BigDecimal</span> b1 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> b2 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v2<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b1<span class="token punctuation">.</span><span class="token function">divide</span><span class="token punctuation">(</span>b2<span class="token punctuation">,</span> scale<span class="token punctuation">,</span> <span class="token class-name">RoundingMode</span><span class="token punctuation">.</span><span class="token constant">HALF_EVEN</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">doubleValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供精确的小数位四舍五入处理。
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v</span>     需要四舍五入的数字
     * <span class="token keyword">@param</span> <span class="token parameter">scale</span> 小数点后保留几位
     * <span class="token keyword">@return</span> 四舍五入后的结果
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">round</span><span class="token punctuation">(</span><span class="token keyword">double</span> v<span class="token punctuation">,</span> <span class="token keyword">int</span> scale<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>scale <span class="token operator">&lt;</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
            <span class="token keyword">throw</span> <span class="token keyword">new</span> <span class="token class-name">IllegalArgumentException</span><span class="token punctuation">(</span>
                    <span class="token string">&quot;The scale must be a positive integer or zero&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span>
        <span class="token class-name">BigDecimal</span> b <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> one <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span><span class="token string">&quot;1&quot;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b<span class="token punctuation">.</span><span class="token function">divide</span><span class="token punctuation">(</span>one<span class="token punctuation">,</span> scale<span class="token punctuation">,</span> <span class="token class-name">RoundingMode</span><span class="token punctuation">.</span><span class="token constant">HALF_UP</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">doubleValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供精确的类型转换(Float)
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v</span> 需要被转换的数字
     * <span class="token keyword">@return</span> 返回转换结果
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">float</span> <span class="token function">convertToFloat</span><span class="token punctuation">(</span><span class="token keyword">double</span> v<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>v<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b<span class="token punctuation">.</span><span class="token function">floatValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供精确的类型转换(Int)不进行四舍五入
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v</span> 需要被转换的数字
     * <span class="token keyword">@return</span> 返回转换结果
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">int</span> <span class="token function">convertsToInt</span><span class="token punctuation">(</span><span class="token keyword">double</span> v<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>v<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b<span class="token punctuation">.</span><span class="token function">intValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 提供精确的类型转换(Long)
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v</span> 需要被转换的数字
     * <span class="token keyword">@return</span> 返回转换结果
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">long</span> <span class="token function">convertsToLong</span><span class="token punctuation">(</span><span class="token keyword">double</span> v<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>v<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b<span class="token punctuation">.</span><span class="token function">longValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 返回两个数中大的一个值
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span> 需要被对比的第一个数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span> 需要被对比的第二个数
     * <span class="token keyword">@return</span> 返回两个数中大的一个值
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">returnMax</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b1 <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> b2 <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>v2<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b1<span class="token punctuation">.</span><span class="token function">max</span><span class="token punctuation">(</span>b2<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">doubleValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 返回两个数中小的一个值
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span> 需要被对比的第一个数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span> 需要被对比的第二个数
     * <span class="token keyword">@return</span> 返回两个数中小的一个值
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">double</span> <span class="token function">returnMin</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b1 <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> b2 <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">(</span>v2<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b1<span class="token punctuation">.</span><span class="token function">min</span><span class="token punctuation">(</span>b2<span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">doubleValue</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

    <span class="token doc-comment comment">/**
     * 精确对比两个数字
     *
     * <span class="token keyword">@param</span> <span class="token parameter">v1</span> 需要被对比的第一个数
     * <span class="token keyword">@param</span> <span class="token parameter">v2</span> 需要被对比的第二个数
     * <span class="token keyword">@return</span> 如果两个数一样则返回0，如果第一个数比第二个数大则返回1，反之返回-1
     */</span>
    <span class="token keyword">public</span> <span class="token keyword">static</span> <span class="token keyword">int</span> <span class="token function">compareTo</span><span class="token punctuation">(</span><span class="token keyword">double</span> v1<span class="token punctuation">,</span> <span class="token keyword">double</span> v2<span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token class-name">BigDecimal</span> b1 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v1<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token class-name">BigDecimal</span> b2 <span class="token operator">=</span> <span class="token class-name">BigDecimal</span><span class="token punctuation">.</span><span class="token function">valueOf</span><span class="token punctuation">(</span>v2<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">return</span> b1<span class="token punctuation">.</span><span class="token function">compareTo</span><span class="token punctuation">(</span>b2<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>

<span class="token punctuation">}</span>

</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="原理" tabindex="-1"><a class="header-anchor" href="#原理" aria-hidden="true">#</a> 原理</h2><p><code>BigDecimal</code> 的实现利用到了 <code>BigInteger</code> （用来操作大整数）, 所不同的是 <code>BigDecimal</code> 加入了小数位的概念。</p>`,5)]))}const i=s(t,[["render",c],["__file","basic017.html.vue"]]);export{i as default};
