import{_ as i,c as n,o as a,a as s}from"./app-DukR-6js.js";const d={};function l(r,e){return a(),n("div",null,e[0]||(e[0]=[s(`<h2 id="开源作者常用做法" tabindex="-1"><a class="header-anchor" href="#开源作者常用做法" aria-hidden="true">#</a> 开源作者常用做法</h2><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>1.git clone // 到本地
2.git checkout -b xxx 切换至新分支xxx
（相当于复制了remote的仓库到本地的xxx分支上
3.修改或者添加本地代码（部署在硬盘的源文件上）
4.git diff 查看自己对代码做出的改变
5.git add 上传更新后的代码至暂存区
6.git commit 可以将暂存区里更新后的代码更新到本地git
7.git push origin xxx 将本地的xxxgit分支上传至github上的git
-----------------------------------------------------------
（如果在写自己的代码过程中发现远端GitHub上代码出现改变）
1.git checkout main 切换回main分支
2.git pull origin master(main) 将远端修改过的代码再更新到本地
3.git checkout xxx 回到xxx分支
4.git rebase main 我在xxx分支上，先把main移过来，然后根据我的commit来修改成新的内容
（中途可能会出现，rebase conflict -----》手动选择保留哪段代码）
5.git push -f origin xxx 把rebase后并且更新过的代码再push到远端github上
（-f ---》强行）
6.原项目主人采用pull request 中的 squash and merge 合并所有不同的commit
-----------------------------------------------------------
远端完成更新后
1.git branch -d xxx 删除本地的git分支
2.git pull origin master 再把远端的最新代码拉至本地
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="实际开发项目" tabindex="-1"><a class="header-anchor" href="#实际开发项目" aria-hidden="true">#</a> 实际开发项目</h2><div class="language-text line-numbers-mode" data-ext="text"><pre class="language-text"><code>实际开发项目可能还会更复杂，使用到的分支比视频里更多
main：生产环境，也就是你们在网上可以下载到的版本，是经过了很多轮测试得到的稳定版本。
release： 开发内部发版，也就是测试环境。
dev：所有的feature都要从dev上checkout。
feature：每个需求新创建的分支。
下面介绍一下一个新需求过来的git操作流程：
1.从dev分支上checkout -b  new-feature，进行开发
2.开发完后，经过自测没问题了，准备发版
3.merge到release分支上进行发版，并打tag
4.有bug就直接在release上进行修改，改完再次发版，打tag，直到测试人员验证完毕
5.这时可以将release分支合并到dev上，也可以删除掉feature分支了，并等待通知是否将此功能上线（发布正式版本，也就是在正式服务器上运行），如果上线，那就merge到main（master）分支，当然了有可能需要将ip改为生产服务器的地址，并打上一个official tag。
6.如果上线后，发现有bug，如果此时main分支已经又合并上新功能B了，但是这个临时的版本又不想包含B的功能，那么可以切换到上次的official tag，checkout -b一个hotfix分支进行bug修复，hotfix分支要进行保留，不能删除。测试没问题就可以发版了，最后可以合并到main上。
一般的项目这套流程应该就足够了。所有的发版tag都会集中到release，main，hotfix分支上，所有的需求都会从dev上拉取，这样能保证代码是完整可用的，是经过每次release合并过来的
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="别人的经验错误" tabindex="-1"><a class="header-anchor" href="#别人的经验错误" aria-hidden="true">#</a> 别人的经验错误</h2><p>说的很好，刚入大厂的我表示就是用的这套流程，刚进来就犯了一次错误，自己的分支上面很多commit然后中间merge了一遍master的代码之后又commit了，结果导致最后PR的时候rebase非常困难，太多冲突了，commit数量太多被diss了。最后还是删除了分支，重新建立一个分支，把所有的改变重新再一个commit上面实现了一遍。后来知道了，千万不要在自己分支没有pr前merge，可以rebase。。。而且每次pr之前我们都要求用rebase -i命令在本地压缩commit到一个，然后再去PR。</p><hr><p>。。。</p>`,8)]))}const c=i(d,[["render",l],["__file","other001.html.vue"]]);export{c as default};
