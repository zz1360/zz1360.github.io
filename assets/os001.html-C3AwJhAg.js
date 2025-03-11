import{_ as e,c as i,o as n,a as d}from"./app-DukR-6js.js";const l={};function t(r,o){return n(),i("div",null,o[0]||(o[0]=[d('<h2 id="inode介绍" tabindex="-1"><a class="header-anchor" href="#inode介绍" aria-hidden="true">#</a> inode介绍</h2><p>inode 是 Linux/Unix 文件系统的基础。</p><p>通过以下五点可以概括 inode 到底是什么：</p><ul><li><p>硬盘以扇区 (Sector) 为最小物理存储单位，而操作系统和文件系统以块 (Block) 为单位进行读写，块由多个扇区组成。文件数据存储在这些块中。现代硬盘扇区通常为 4KB，与一些常见块大小相同，但操作系统也支持更大的块大小，以提升大文件读写性能。文件元信息（例如权限、大小、修改时间以及数据块位置）存储在 inode（索引节点）中。<strong>每个文件都有唯一的 inode</strong>。inode 本身不存储文件数据，而是存储指向数据块的指针，操作系统通过这些指针找到并读取文件数据。 固态硬盘 (SSD) 虽然没有物理扇区，但使用逻辑块，其概念与传统硬盘的块类似。</p></li><li><p>inode 是一种固定大小的数据结构，其大小在文件系统创建时就确定了，并且在文件的生命周期内保持不变。</p></li><li><p>inode 的访问速度非常快，因为系统可以直接通过 inode 号码定位到文件的元数据信息，无需遍历整个文件系统。</p></li><li><p><strong>inode 的数量是有限的，每个文件系统只能包含固定数量的 inode</strong>。这意味着当文件系统中的 inode 用完时，无法再创建新的文件或目录，即使磁盘上还有可用空间。因此，在创建文件系统时，需要根据文件和目录的预期数量来合理分配 inode 的数量。</p></li><li><p>可以使用 <code>stat</code> 命令可以查看文件的 inode 信息，包括文件的 inode 号、文件类型、权限、所有者、文件大小、修改时间。</p></li></ul><p>简单来说：inode 就是用来维护某个文件被分成几块、每一块在的地址、文件拥有者，创建时间，权限，大小等信息。</p><p>再总结一下 inode 和 block：</p><ul><li><strong>inode</strong>：记录文件的属性信息，可以使用 <code>stat</code> 命令查看 inode 信息。</li><li><strong>block</strong>：实际文件的内容，如果一个文件大于一个块时候，那么将占用多个 block，但是一个块只能存放一个文件。（因为数据是由 inode 指向的，如果有两个文件的数据存放在同一个块中，就会乱套了）</li></ul>',7)]))}const c=e(l,[["render",t],["__file","os001.html.vue"]]);export{c as default};
