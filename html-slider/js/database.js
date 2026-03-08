class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        // In a real application, we would use SQLite via a server-side implementation
        // For this client-side demo, we'll use localStorage to simulate database operations
        this.db = localStorage;
        this.createTables();
    }

    createTables() {
        // Create presentations table if it doesn't exist
        if (!this.db.getItem('presentations')) {
            this.db.setItem('presentations', JSON.stringify([]));
        }

        // Create pages table if it doesn't exist
        if (!this.db.getItem('pages')) {
            this.db.setItem('pages', JSON.stringify([]));
        }
    }

    // Presentation operations
    createPresentation(name) {
        const presentations = JSON.parse(this.db.getItem('presentations') || '[]');
        const newPresentation = {
            id: Date.now(),
            name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        presentations.push(newPresentation);
        this.db.setItem('presentations', JSON.stringify(presentations));
        return newPresentation;
    }

    getPresentations() {
        return JSON.parse(this.db.getItem('presentations') || '[]');
    }

    getPresentation(id) {
        const presentations = JSON.parse(this.db.getItem('presentations') || '[]');
        return presentations.find(p => p.id == id);
    }

    updatePresentation(id, updates) {
        const presentations = JSON.parse(this.db.getItem('presentations') || '[]');
        const index = presentations.findIndex(p => p.id == id);
        if (index !== -1) {
            presentations[index] = { ...presentations[index], ...updates, updated_at: new Date().toISOString() };
            this.db.setItem('presentations', JSON.stringify(presentations));
            return presentations[index];
        }
        return null;
    }

    deletePresentation(id) {
        const presentations = JSON.parse(this.db.getItem('presentations') || '[]');
        const filteredPresentations = presentations.filter(p => p.id != id);
        this.db.setItem('presentations', JSON.stringify(filteredPresentations));
        
        // Also delete associated pages
        const pages = JSON.parse(this.db.getItem('pages') || '[]');
        const filteredPages = pages.filter(p => p.presentation_id != id);
        this.db.setItem('pages', JSON.stringify(filteredPages));
    }

    // Page operations
    createPage(presentationId, filePath, orderIndex, thumbnail = null) {
        const pages = JSON.parse(this.db.getItem('pages') || '[]');
        const newPage = {
            id: Date.now(),
            presentation_id: presentationId,
            file_path: filePath,
            thumbnail: thumbnail,
            order_index: orderIndex,
            created_at: new Date().toISOString()
        };
        pages.push(newPage);
        this.db.setItem('pages', JSON.stringify(pages));
        return newPage;
    }

    getPages(presentationId) {
        const pages = JSON.parse(this.db.getItem('pages') || '[]');
        return pages.filter(p => p.presentation_id == presentationId).sort((a, b) => a.order_index - b.order_index);
    }

    updatePage(id, updates) {
        const pages = JSON.parse(this.db.getItem('pages') || '[]');
        const index = pages.findIndex(p => p.id == id);
        if (index !== -1) {
            pages[index] = { ...pages[index], ...updates };
            this.db.setItem('pages', JSON.stringify(pages));
            return pages[index];
        }
        return null;
    }

    deletePage(id) {
        const pages = JSON.parse(this.db.getItem('pages') || '[]');
        const filteredPages = pages.filter(p => p.id != id);
        this.db.setItem('pages', JSON.stringify(filteredPages));
    }

    updatePageOrder(presentationId, newOrder) {
        const pages = JSON.parse(this.db.getItem('pages') || '[]');
        const presentationPages = pages.filter(p => p.presentation_id == presentationId);
        
        newOrder.forEach((pageId, index) => {
            const page = presentationPages.find(p => p.id == pageId);
            if (page) {
                page.order_index = index;
            }
        });
        
        this.db.setItem('pages', JSON.stringify(pages));
    }
}

// Create a singleton instance
const db = new Database();