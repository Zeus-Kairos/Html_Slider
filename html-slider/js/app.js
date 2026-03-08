class App {
    constructor() {
        this.currentPresentation = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPresentations();
    }

    setupEventListeners() {
        // Modal events
        document.getElementById('create-presentation').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'block';
        });

        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                document.getElementById('modal').style.display = 'none';
            }
        });

        // Form submission
        document.getElementById('create-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPresentation();
        });

        // Page management events
        document.getElementById('add-page').addEventListener('click', () => {
            this.addPage();
        });

        // Play presentation event
        document.getElementById('play-presentation').addEventListener('click', () => {
            this.playPresentation();
        });

        // Setup drag and drop for page reordering
        this.setupDragAndDrop();
    }

    loadPresentations() {
        const presentations = db.getPresentations();
        const presentationsList = document.getElementById('presentations');
        presentationsList.innerHTML = '';

        presentations.forEach(presentation => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = presentation.name;
            nameSpan.style.flex = '1';
            nameSpan.addEventListener('click', () => {
                this.selectPresentation(presentation.id);
            });
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.padding = '4px 8px';
            deleteButton.style.backgroundColor = '#dc3545';
            deleteButton.style.color = 'white';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '4px';
            deleteButton.style.fontSize = '12px';
            deleteButton.style.marginLeft = '10px';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this presentation?')) {
                    db.deletePresentation(presentation.id);
                    if (this.currentPresentation && this.currentPresentation.id == presentation.id) {
                        this.currentPresentation = null;
                        document.getElementById('pages').innerHTML = '';
                    }
                    this.loadPresentations();
                }
            });
            
            li.appendChild(nameSpan);
            li.appendChild(deleteButton);
            li.dataset.id = presentation.id;
            presentationsList.appendChild(li);
        });
    }

    selectPresentation(id) {
        // Remove active class from all presentations
        document.querySelectorAll('#presentations li').forEach(li => {
            li.classList.remove('active');
        });

        // Add active class to selected presentation
        const selectedLi = document.querySelector(`#presentations li[data-id="${id}"]`);
        if (selectedLi) {
            selectedLi.classList.add('active');
        }

        this.currentPresentation = db.getPresentation(id);
        this.loadPages(id);
    }

    loadPages(presentationId) {
        const pages = db.getPages(presentationId);
        const pagesList = document.getElementById('pages');
        pagesList.innerHTML = '';

        pages.forEach(page => {
            const li = document.createElement('li');
            li.dataset.id = page.id;
            li.draggable = true;
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.padding = '8px';
            li.style.border = '1px solid #ddd';
            li.style.borderRadius = '4px';
            li.style.marginBottom = '8px';
            
            // Add thumbnail if available
            if (page.thumbnail) {
                const thumbnail = document.createElement('img');
                thumbnail.src = page.thumbnail;
                thumbnail.style.width = '60px';
                thumbnail.style.height = '45px';
                thumbnail.style.objectFit = 'cover';
                thumbnail.style.marginRight = '10px';
                thumbnail.style.borderRadius = '4px';
                li.appendChild(thumbnail);
            }
            
            const pageInfo = document.createElement('div');
            pageInfo.classList.add('page-info');
            pageInfo.style.flex = '1';
            
            // Extract file name from JSON object or use the path directly
            let displayName = page.file_path;
            if (page.file_path.startsWith('{')) {
                try {
                    const pageData = JSON.parse(page.file_path);
                    displayName = pageData.fileName || 'HTML File';
                } catch (e) {
                    displayName = 'HTML File';
                }
            } else if (page.file_path.startsWith('data:')) {
                // Handle old format data URLs
                displayName = 'HTML File';
            }
            pageInfo.textContent = displayName;

            const pageActions = document.createElement('div');
            pageActions.classList.add('page-actions');

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.style.padding = '4px 8px';
            deleteButton.style.backgroundColor = '#dc3545';
            deleteButton.style.color = 'white';
            deleteButton.style.border = 'none';
            deleteButton.style.borderRadius = '4px';
            deleteButton.style.fontSize = '12px';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePage(page.id);
            });

            pageActions.appendChild(deleteButton);
            li.appendChild(pageInfo);
            li.appendChild(pageActions);
            pagesList.appendChild(li);
        });
    }

    async createPresentation() {
        const name = document.getElementById('presentation-name').value;
        const fileInput = document.getElementById('file-select');
        const files = fileInput.files;

        if (!name) {
            alert('Please enter a presentation name.');
            return;
        }

        const presentation = db.createPresentation(name);

        if (files.length > 0) {
            // Add selected files as pages
            let processedFiles = 0;
            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    // Store the file content as a data URL with file name
                    const dataUrl = e.target.result;
                    // Create an object with both data URL and file name
                    const pageData = {
                        dataUrl: dataUrl,
                        fileName: file.name
                    };
                    
                    // Generate thumbnail
                    const thumbnail = await this.generateThumbnail(dataUrl);
                    
                    db.createPage(presentation.id, JSON.stringify(pageData), index, thumbnail);
                    processedFiles++;
                    
                    // When all files are processed
                    if (processedFiles === files.length) {
                        // Close modal and reset form
                        document.getElementById('modal').style.display = 'none';
                        document.getElementById('create-form').reset();

                        // Reload presentations and select the new one
                        this.loadPresentations();
                        this.selectPresentation(presentation.id);
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            // No files selected, just create an empty presentation
            // Close modal and reset form
            document.getElementById('modal').style.display = 'none';
            document.getElementById('create-form').reset();

            // Reload presentations and select the new one
            this.loadPresentations();
            this.selectPresentation(presentation.id);
        }
    }

    addPage() {
        if (!this.currentPresentation) {
            alert('Please select a presentation first.');
            return;
        }

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.html';
        fileInput.multiple = true;
        fileInput.onchange = async (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                let processedFiles = 0;
                const pages = db.getPages(this.currentPresentation.id);
                const baseOrderIndex = pages.length;
                
                Array.from(files).forEach((file, index) => {
                    const reader = new FileReader();
                    const fileOrderIndex = baseOrderIndex + index;
                    reader.onload = async (e) => {
                        const dataUrl = e.target.result;
                        // Create an object with both data URL and file name
                        const pageData = {
                            dataUrl: dataUrl,
                            fileName: file.name
                        };
                        
                        // Generate thumbnail
                        const thumbnail = await this.generateThumbnail(dataUrl);
                        
                        db.createPage(this.currentPresentation.id, JSON.stringify(pageData), fileOrderIndex, thumbnail);
                        processedFiles++;
                        
                        // When all files are processed
                        if (processedFiles === files.length) {
                            this.loadPages(this.currentPresentation.id);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }
        };
        fileInput.click();
    }

    deletePage(pageId) {
        db.deletePage(pageId);
        this.loadPages(this.currentPresentation.id);
    }

    deleteSelectedPage() {
        const selectedPage = document.querySelector('#pages li.selected');
        if (selectedPage) {
            this.deletePage(selectedPage.dataset.id);
        } else {
            alert('Please select a page to delete.');
        }
    }

    playPresentation() {
        if (!this.currentPresentation) {
            alert('Please select a presentation first.');
            return;
        }

        const pages = db.getPages(this.currentPresentation.id);
        if (pages.length === 0) {
            alert('This presentation has no pages.');
            return;
        }

        // Create a new window for playback (maximized)
        const width = screen.width;
        const height = screen.height;
        const playbackWindow = window.open('playback.html', '_blank', `width=${width},height=${height},left=0,top=0`);
        
        // Wait for the window to load before writing content
        playbackWindow.onload = function() {
            // Update the title
            playbackWindow.document.title = `${this.currentPresentation.name} - Playback`;
            
            // Get the presentation container
            const container = playbackWindow.document.getElementById('presentation-container');
            
            // Clear existing content
            container.innerHTML = '';
            
            // --- 替换开始：使用 fetch 解析 Data URL 并注入通信脚本 ---
            pages.forEach((page, index) => {
                const pageDiv = playbackWindow.document.createElement('div');
                pageDiv.className = `page ${index === 0 ? 'active' : ''}`;
                pageDiv.setAttribute('data-index', index);
                
                const iframe = playbackWindow.document.createElement('iframe');
                let src = page.file_path;
                if (page.file_path.startsWith('{')) {
                    try {
                        const pageData = JSON.parse(page.file_path);
                        src = pageData.dataUrl;
                    } catch (e) {
                        // Fallback
                    }
                }
                
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = 'none';

                // 【核心修复】：如果是 data URL，解析它并注入后门脚本
                if (src.startsWith('data:text/html')) {
                    fetch(src)
                        .then(res => res.text()) // 将 base64 完美转换为 HTML 文本
                        .then(html => {
                            // 注入一段脚本：专门捕获左右键发送给父窗口，放行回车键
                            const injection = `
                                <script>
                                    window.addEventListener('keydown', function(e) {
                                        if (['ArrowRight', 'ArrowLeft', 'Space'].includes(e.code)) {
                                            e.preventDefault();
                                            e.stopImmediatePropagation();
                                            // 向父级发送翻页消息
                                            window.parent.postMessage({ type: 'navigate', code: e.code }, '*');
                                        }
                                        // 注意：这里绝对不拦截 Enter 键，你的页面动画可以正常接收！
                                    }, true);
                                <\/script>
                            `;
                            // 使用 srcdoc 渲染，彻底避免跨域访问限制
                            iframe.srcdoc = html + injection;
                        })
                        .catch(err => {
                            console.error("加载幻灯片失败:", err);
                            iframe.src = src; // 兜底方案
                        });
                } else {
                    iframe.src = src;
                }
                
                pageDiv.appendChild(iframe);
                container.appendChild(pageDiv);
            });
            
            // Add playback logic
            const script = playbackWindow.document.createElement('script');
            script.textContent = `
                let currentPage = 0;
                const pages = document.querySelectorAll('.page');
                const totalPages = pages.length;

                function showPage(index) {
                    if (index < 0) index = totalPages - 1;
                    if (index >= totalPages) index = 0;
                    
                    pages.forEach((page, i) => {
                        if (i === index) {
                            page.style.zIndex = "2";
                            page.style.opacity = "1";
                            page.style.pointerEvents = "auto";
                            // 切换后，主动把焦点交给 iframe，这样直接按 Enter 就能触发动画
                            setTimeout(() => {
                                const iframe = page.querySelector('iframe');
                                if (iframe) iframe.focus();
                            }, 50);
                        } else {
                            page.style.zIndex = "1";
                            setTimeout(() => {
                                if (i !== index) {
                                    page.style.opacity = "0";
                                    page.style.pointerEvents = "none";
                                }
                            }, 50); 
                        }
                    });
                    currentPage = index;
                }

                // 1. 监听父窗口自身的按键 (处理焦点不在 iframe 时的操作)
                window.addEventListener('keydown', (e) => {
                    if (['ArrowRight', 'ArrowLeft', 'Space'].includes(e.code)) {
                        e.preventDefault();
                        if (e.code === 'ArrowLeft') showPage(currentPage - 1);
                        else showPage(currentPage + 1);
                    }
                }, true);

                // 2. 【核心修复】：监听从 iframe 内部传来的翻页消息
                window.addEventListener('message', (e) => {
                    if (e.data && e.data.type === 'navigate') {
                        if (e.data.code === 'ArrowLeft') showPage(currentPage - 1);
                        else showPage(currentPage + 1);
                    }
                });

                // 初始显示
                showPage(0);
            `;
            
            playbackWindow.document.body.appendChild(script);

            const style = playbackWindow.document.createElement('style');
            style.textContent = `
                body { margin: 0; background: #000; overflow: hidden; }
                #presentation-container { position: relative; width: 100vw; height: 100vh; }
                .page { 
                    position: absolute; 
                    top: 0; left: 0; 
                    width: 100%; height: 100%; 
                    opacity: 0; 
                    pointer-events: none;
                    transition: opacity 0.3s ease-in-out; 
                    background: #000; /* Prevents white flash */
                }
                .page.active { opacity: 1; z-index: 2; pointer-events: auto; }
                iframe { width: 100%; height: 100%; border: none; }
            `;
            playbackWindow.document.head.appendChild(style);
        }.bind(this);
    }

    async generateThumbnail(dataUrl) {
        console.log(">>> 准备生成缩略图...");
        return new Promise(async (resolve) => {
            const timeoutId = setTimeout(() => {
                console.warn("生成超时 (5秒)，使用兜底占位图");
                resolve(this.getFallbackThumbnail());
            }, 5000);

            try {
                // 1. 先将内容 fetch 出来
                const res = await fetch(dataUrl);
                const htmlText = await res.text();

                // 2. 创建 iframe 并立即添加到 body 中（这是获取 contentDocument 的前提）
                const iframe = document.createElement('iframe');
                // 必须先设置样式隐藏起来，避免闪烁
                iframe.style.cssText = "position:fixed; width:800px; height:600px; left:-10000px; top:-10000px; z-index:-1; visibility:hidden;";
                document.body.appendChild(iframe); 

                // 3. 监听加载事件
                iframe.onload = async () => {
                    console.log(">>> Iframe onload 触发");
                    
                    // 核心修复：增加重试机制和空值检查
                    const getTarget = () => {
                        return iframe.contentDocument || (iframe.contentWindow ? iframe.contentWindow.document : null);
                    };

                    const doc = getTarget();
                    if (!doc || !doc.body) {
                        console.error(">>> 无法获取 iframe 内部文档，截图失败");
                        if (document.body.contains(iframe)) document.body.removeChild(iframe);
                        clearTimeout(timeoutId);
                        resolve(this.getFallbackThumbnail());
                        return;
                    }

                    try {
                        // 等待一段时间确保内容（包括图片/样式）渲染完成
                        await new Promise(r => setTimeout(r, 500));

                        console.log(">>> 开始执行 html2canvas...");
                        const canvas = await html2canvas(doc.body, {
                            width: 800,
                            height: 600,
                            scale: 0.2, // 生成 160x120 左右的中间件
                            useCORS: true,
                            logging: false
                        });

                        const thumb = canvas.toDataURL('image/png');
                        console.log(">>> 缩略图生成成功！");
                        
                        if (document.body.contains(iframe)) document.body.removeChild(iframe);
                        clearTimeout(timeoutId);
                        resolve(thumb);
                    } catch (err) {
                        console.error(">>> html2canvas 运行报错:", err);
                        if (document.body.contains(iframe)) document.body.removeChild(iframe);
                        clearTimeout(timeoutId);
                        resolve(this.getFallbackThumbnail());
                    }
                };

                // 4. 最后设置内容触发加载
                iframe.srcdoc = htmlText;

            } catch (err) {
                console.error(">>> 初始化过程报错:", err);
                clearTimeout(timeoutId);
                resolve(this.getFallbackThumbnail());
            }
        });
    }

    // 确保保留这个兜底方法，与上面的方法平级
    getFallbackThumbnail() {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 120, 90);
        
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Preview', 60, 50);
        
        return canvas.toDataURL('image/png');
    }

    // 兜底的默认占位图方法
    getFallbackThumbnail() {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 120, 90);
        
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Preview', 60, 50);
        
        return canvas.toDataURL('image/png');
    }

    setupDragAndDrop() {
        const pagesList = document.getElementById('pages');
        let draggedItem = null;

        pagesList.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'LI') {
                draggedItem = e.target;
                setTimeout(() => {
                    e.target.style.opacity = '0.5';
                }, 0);
            }
        });

        pagesList.addEventListener('dragend', (e) => {
            if (e.target.tagName === 'LI') {
                e.target.style.opacity = '1';
                draggedItem = null;
            }
        });

        pagesList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        pagesList.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (e.target.tagName === 'LI' && e.target !== draggedItem) {
                e.target.style.backgroundColor = '#e0e0e0';
            }
        });

        pagesList.addEventListener('dragleave', (e) => {
            if (e.target.tagName === 'LI') {
                e.target.style.backgroundColor = '';
            }
        });

        pagesList.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.target.tagName === 'LI' && e.target !== draggedItem) {
                e.target.style.backgroundColor = '';
                
                const list = pagesList;
                const draggedIndex = Array.from(list.children).indexOf(draggedItem);
                const targetIndex = Array.from(list.children).indexOf(e.target);
                
                if (draggedIndex < targetIndex) {
                    list.insertBefore(draggedItem, e.target.nextSibling);
                } else {
                    list.insertBefore(draggedItem, e.target);
                }
                
                // Update page order in database
                const newOrder = Array.from(list.children).map(li => li.dataset.id);
                db.updatePageOrder(this.currentPresentation.id, newOrder);
            }
        });

        // Add click event to select pages
        pagesList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                document.querySelectorAll('#pages li').forEach(li => {
                    li.classList.remove('selected');
                });
                e.target.classList.add('selected');
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});