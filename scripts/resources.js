class ResourcesManager {
    constructor() {
        this.db = firebase.firestore();
        this.resourceTypes = ['video', 'audio', 'article'];
        this.initializeResources().catch(error => {
            console.error('Error initializing resources:', error);
            // Show user-friendly error message
            const container = document.getElementById('resources-container');
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <h3>Unable to load resources</h3>
                        <p>Please check your internet connection and try again later.</p>
                    </div>
                `;
            }
        });
    }

    async initializeResources() {
        const container = document.getElementById('resources-container');
        if (!container) return;

        // Create filter buttons
        container.innerHTML = `
            <div class="resources-filters">
                <button class="filter-btn active" data-type="all">All</button>
                ${this.resourceTypes.map(type => `
                    <button class="filter-btn" data-type="${type}">
                        ${type.charAt(0).toUpperCase() + type.slice(1)}s
                    </button>
                `).join('')}
            </div>
            <div class="resources-grid"></div>
        `;

        // Add event listeners to filter buttons
        const filterBtns = container.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadResources(btn.dataset.type);
            });
        });

        // Load initial resources
        await this.loadResources('all');
    }

    async loadResources(type = 'all') {
        const grid = document.querySelector('.resources-grid');
        if (!grid) return;

        try {
            // Clear existing content
            grid.innerHTML = '<div class="loading">Loading resources...</div>';

            // Get resources from Firestore
            let query = this.db.collection('resources');
            if (type !== 'all') {
                query = query.where('type', '==', type);
            }
            
            const snapshot = await query.get();
            const resources = [];
            
            snapshot.forEach(doc => {
                resources.push({ id: doc.id, ...doc.data() });
            });

            // Display resources
            if (resources.length === 0) {
                grid.innerHTML = '<div class="no-resources">No resources available.</div>';
                return;
            }

            grid.innerHTML = resources.map(resource => this.createResourceCard(resource)).join('');

            // Add click handlers for resource cards
            const cards = grid.querySelectorAll('.resource-card');
            cards.forEach(card => {
                card.addEventListener('click', () => {
                    window.open(card.dataset.url, '_blank', 'noopener,noreferrer');
                });
            });

        } catch (error) {
            grid.innerHTML = '<div class="error">Error loading resources. Please try again later.</div>';
            console.error('Error loading resources:', error);
        }
    }

    // createResourceCard(resource) {
    //     const typeIcons = {
    //         video: '🎥',
    //         audio: '🎧',
    //         article: '📖'
    //     };

    //     return `
    //         <div class="resource-card" data-url="${resource.url}">
    //             <div class="resource-type">
    //                 ${typeIcons[resource.type] || '📄'}
    //                 <span>${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</span>
    //             </div>
    //             <h3>${resource.title}</h3>
    //             <p>${resource.description}</p>
    //             <div class="resource-footer">
    //                 <span class="duration">${resource.duration || 'Self-paced'}</span>
    //                 <button class="view-btn">View Resource</button>
    //             </div>
    //         </div>
    //     `;
    // }

   
   createResourceCard(resource) {
        const typeIcons = {
            video: '🎥',
            audio: '🎧',
            article: '📖',
            game: '🎮'
        };

    // Determine content based on resource type
        let content;
        if (resource.type === 'video') {
            content = `<iframe width="100%" height="200" src="${this.getYouTubeEmbedURL(resource.url)}"
                    frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen></iframe>`;
        } else if (resource.type === 'game') {
            content = `<p>${resource.description}</p>`;
        } else {
            content = `<p>${resource.description}</p>`;
        }

        return `
            <div class="resource-card">
                <div class="resource-type">
                    ${typeIcons[resource.type] || '📄'}
                    <span>${resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}</span>
                </div>
                <h3>${resource.title}</h3>
                ${content}
                ${resource.type !== 'video' ? `<div class="resource-footer">
                    <span class="duration">${resource.duration || 'Self-paced'}</span>
                    <button class="view-btn" onclick="window.open('${resource.url}','_blank')">View Resource</button>
                </div>` : ''}
            </div>
        `;
    }

    getYouTubeEmbedURL(url) {
        // Example: convert https://www.youtube.com/watch?v=abc123 → https://www.youtube.com/embed/abc123
        const videoIdMatch = url.match(/(?:\?v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
        if(videoIdMatch && videoIdMatch[1]){
            return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
        }
        return url; // fallback
    }
   
   
    // Helper method to add a new resource (for admin use)
    async addResource(resourceData) {
        try {
            await this.db.collection('resources').add({
                ...resourceData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

}

// Initialize resources manager when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const resourcesManager = new ResourcesManager();
});
