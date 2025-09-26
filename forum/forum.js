class PeerForum {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.postsPerPage = 10;
        this.lastVisible = null;
        this.isLoading = false;
        this.initializeForum();
    }

    async initializeForum() {
        const container = document.getElementById('forum-container');
        if (!container) return;

        container.innerHTML = `
            <div class="forum-header">
                <h2>Safe Space Discussion</h2>
                <p>Share your thoughts anonymously and support each other.</p>
            </div>

            <form id="post-form" class="post-form">
                <div class="form-group">
                    <label for="post-title">Title:</label>
                    <input type="text" id="post-title" required 
                        placeholder="Give your post a title...">
                </div>
                <div class="form-group">
                    <label for="post-content">Share your thoughts:</label>
                    <textarea id="post-content" required rows="4"
                        placeholder="What's on your mind? Your identity will remain anonymous..."></textarea>
                </div>
                <div class="post-options">
                    <label class="anonymous-toggle">
                        <input type="checkbox" id="anonymous" checked>
                        Post Anonymously
                    </label>
                    <button type="submit">Share Post</button>
                </div>
            </form>

            <div class="posts-container">
                <div class="posts-list"></div>
                <button id="load-more" class="load-more-btn">Load More Posts</button>
            </div>
        `;

        this.setupEventListeners();
        await this.loadPosts();
    }

    setupEventListeners() {
        // Post form submission
        const form = document.getElementById('post-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!this.auth.currentUser) {
                    alert('Please login to post');
                    return;
                }

                const postData = {
                    title: form['post-title'].value.trim(),
                    content: form['post-content'].value.trim(),
                    anonymous: form['anonymous'].checked,
                    authorId: this.auth.currentUser.uid,
                    authorName: form['anonymous'].checked ? 'Anonymous' : this.auth.currentUser.email.split('@')[0],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    likes: 0,
                    reports: 0
                };

                try {
                    await this.createPost(postData);
                    form.reset();
                    await this.loadPosts(true); // Reload posts from the beginning
                } catch (error) {
                    alert('Error creating post: ' + error.message);
                }
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                if (!this.isLoading) {
                    this.loadPosts();
                }
            });
        }
    }

    async createPost(postData) {
        await this.db.collection('forum_posts').add(postData);
    }

    async loadPosts(reset = false) {
        if (this.isLoading) return;
        this.isLoading = true;

        const postsContainer = document.querySelector('.posts-list');
        const loadMoreBtn = document.getElementById('load-more');
        
        if (!postsContainer || !loadMoreBtn) return;

        try {
            if (reset) {
                postsContainer.innerHTML = '';
                this.lastVisible = null;
            }

            let query = this.db.collection('forum_posts')
                .orderBy('createdAt', 'desc')
                .limit(this.postsPerPage);

            if (this.lastVisible) {
                query = query.startAfter(this.lastVisible);
            }

            const snapshot = await query.get();
            
            if (snapshot.empty) {
                loadMoreBtn.style.display = 'none';
                if (reset) {
                    postsContainer.innerHTML = '<div class="no-posts">No posts yet. Be the first to share!</div>';
                }
                return;
            }

            this.lastVisible = snapshot.docs[snapshot.docs.length - 1];
            
            const posts = [];
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });

            this.renderPosts(posts, postsContainer);
            loadMoreBtn.style.display = 'block';

        } catch (error) {
            console.error('Error loading posts:', error);
            postsContainer.innerHTML += '<div class="error">Error loading posts. Please try again later.</div>';
        } finally {
            this.isLoading = false;
        }
    }

    renderPosts(posts, container) {
        const currentUser = this.auth.currentUser;
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'forum-post';
            
            const date = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Just now';
            
            postElement.innerHTML = `
                <div class="post-header">
                    <h3>${post.title}</h3>
                    <span class="post-meta">
                        Posted by ${post.authorName} on ${date}
                    </span>
                </div>
                <div class="post-content">${this.formatContent(post.content)}</div>
                <div class="post-footer">
                    <button class="like-btn" data-post-id="${post.id}">
                        👍 ${post.likes || 0}
                    </button>
                    ${currentUser && currentUser.uid !== post.authorId ? `
                        <button class="report-btn" data-post-id="${post.id}">
                            ⚠️ Report
                        </button>
                    ` : ''}
                </div>
            `;

            // Add event listeners for like and report buttons
            const likeBtn = postElement.querySelector('.like-btn');
            const reportBtn = postElement.querySelector('.report-btn');

            if (likeBtn) {
                likeBtn.addEventListener('click', () => this.handleLike(post.id));
            }

            if (reportBtn) {
                reportBtn.addEventListener('click', () => this.handleReport(post.id));
            }

            container.appendChild(postElement);
        });
    }

    formatContent(content) {
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }

    async handleLike(postId) {
        if (!this.auth.currentUser) {
            alert('Please login to like posts');
            return;
        }

        try {
            await this.db.collection('forum_posts').doc(postId).update({
                likes: firebase.firestore.FieldValue.increment(1)
            });
            
            // Update the like count in the UI
            const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
            if (likeBtn) {
                const currentLikes = parseInt(likeBtn.textContent.match(/\d+/)[0]);
                likeBtn.textContent = `👍 ${currentLikes + 1}`;
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }

    async handleReport(postId) {
        if (!this.auth.currentUser) {
            alert('Please login to report posts');
            return;
        }

        if (confirm('Are you sure you want to report this post?')) {
            try {
                await this.db.collection('forum_posts').doc(postId).update({
                    reports: firebase.firestore.FieldValue.increment(1)
                });
                alert('Post reported. Our moderators will review it.');
            } catch (error) {
                console.error('Error reporting post:', error);
            }
        }
    }
}

// Initialize forum when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const forum = new PeerForum();
});
