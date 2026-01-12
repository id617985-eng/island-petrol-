// ================================
// DYNAMIC SLIDESHOW MANAGER
// Uses AI Foodies and Nachos menu items
// ================================

class SlideshowManager {
    constructor() {
        this.slides = [];
        this.menuItems = {
            nachos: [],
            desserts: []
        };
        this.settings = {
            duration: 5000,
            maxSlides: 5,
            animation: 'fade',
            autoRefresh: true
        };
        this.loadSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('slideshowSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }
    
    saveSettings() {
        localStorage.setItem('slideshowSettings', JSON.stringify(this.settings));
    }
    
    async loadMenuItems() {
        try {
            // Load from localStorage or use default items
            const savedNachos = localStorage.getItem('nachosItems');
            const savedDesserts = localStorage.getItem('aiFoodiesItems');
            
            if (savedNachos) {
                this.menuItems.nachos = JSON.parse(savedNachos);
            } else {
                this.menuItems.nachos = this.getDefaultNachos();
                localStorage.setItem('nachosItems', JSON.stringify(this.menuItems.nachos));
            }
            
            if (savedDesserts) {
                this.menuItems.desserts = JSON.parse(savedDesserts);
            } else {
                this.menuItems.desserts = this.getDefaultDesserts();
                localStorage.setItem('aiFoodiesItems', JSON.stringify(this.menuItems.desserts));
            }
            
            return true;
        } catch (error) {
            console.error('Error loading menu items:', error);
            return false;
        }
    }
    
    getDefaultNachos() {
        return [
            {
                name: "Regular Nachos",
                price: 35,
                image: "image/classic nachos.jpg",
                category: "nachos",
                description: "Classic nachos with cheese and toppings"
            },
            {
                name: "Veggie Nachos",
                price: 65,
                image: "https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Veggie+Nachos",
                category: "nachos",
                description: "Vegetarian nachos with fresh vegetables"
            },
            {
                name: "Overload Cheesy Nachos",
                price: 95,
                image: "image/overload chees nachos.jpg",
                category: "nachos",
                description: "Extra cheese loaded nachos"
            },
            {
                name: "Nacho Combo",
                price: 75,
                image: "https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Nacho+Combo",
                category: "nachos",
                description: "Nachos with dips combo"
            },
            {
                name: "Nacho Fries",
                price: 85,
                image: "image/nacho fries.jpg",
                category: "nachos",
                description: "Crispy fries with nacho toppings"
            },
            {
                name: "Supreme Nachos",
                price: 180,
                image: "https://via.placeholder.com/300x200/F44336/FFFFFF?text=Supreme+Nachos",
                category: "nachos",
                description: "Premium nachos with all toppings"
            },
            {
                name: "Shawarma fries",
                price: 120,
                image: "image/shawarma fries.jpg",
                category: "nachos",
                description: "Fries with shawarma meat and sauce"
            }
        ];
    }
    
    getDefaultDesserts() {
        return [
            {
                name: "Mango Graham",
                price: 40,
                image: "image/mango.gif",
                category: "desserts",
                description: "Mango and graham cracker dessert"
            },
            {
                name: "Mango tiramisu on tube",
                price: 100,
                image: "image/mango tiramisu on tub-price 100.jpeg",
                category: "desserts",
                description: "Mango tiramisu in a tube"
            },
            {
                name: "Biscoff",
                price: 159,
                image: "image/biscoff.jpeg",
                category: "desserts",
                description: "Biscoff cookie dessert"
            },
            {
                name: "Oreo",
                price: 149,
                image: "image/oreo and bisscoff.png",
                category: "desserts",
                description: "Oreo cookie dessert"
            },
            {
                name: "Mango Graham Float",
                price: 40,
                image: "image/Mango Graham Floa.jpg",
                category: "desserts",
                description: "Mango graham float dessert"
            }
        ];
    }
    
    getAllMenuItems() {
        return [...this.menuItems.nachos, ...this.menuItems.desserts];
    }
    
    generateSlidesFromMenuItems(count = null) {
        const maxSlides = count || this.settings.maxSlides;
        const allItems = this.getAllMenuItems();
        
        if (allItems.length === 0) {
            console.warn('No menu items available for slides');
            return [];
        }
        
        // Shuffle items and select limited number
        const shuffled = [...allItems].sort(() => Math.random() - 0.5);
        const selectedItems = shuffled.slice(0, Math.min(maxSlides, shuffled.length));
        
        // Convert items to slides
        const slides = selectedItems.map((item, index) => ({
            _id: `slide_${Date.now()}_${index}`,
            title: item.name,
            description: `${item.description} - ₱${item.price}`,
            imageUrl: item.image,
            order: index + 1,
            active: true,
            promoBadge: this.generatePromoBadge(item),
            menuItem: true,
            itemId: item.name.toLowerCase().replace(/ /g, '_'),
            category: item.category,
            price: item.price,
            createdAt: new Date().toISOString()
        }));
        
        return slides;
    }
    
    generatePromoBadge(item) {
        const badges = ['Best Seller', 'Popular', 'New', 'Special', 'Limited'];
        const randomBadge = badges[Math.floor(Math.random() * badges.length)];
        
        // Special badges based on price
        if (item.price > 100) return 'Premium';
        if (item.price < 50) return 'Budget Friendly';
        
        return Math.random() > 0.5 ? randomBadge : null;
    }
    
    addSlideFromMenuItem(itemId) {
        const allItems = this.getAllMenuItems();
        const item = allItems.find(i => 
            i.name.toLowerCase().replace(/ /g, '_') === itemId ||
            i.name.toLowerCase() === itemId
        );
        
        if (!item) {
            throw new Error('Menu item not found');
        }
        
        const newSlide = {
            _id: `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: item.name,
            description: `${item.description} - ₱${item.price}`,
            imageUrl: item.image,
            order: this.slides.length + 1,
            active: true,
            promoBadge: this.generatePromoBadge(item),
            menuItem: true,
            itemId: item.name.toLowerCase().replace(/ /g, '_'),
            category: item.category,
            price: item.price,
            createdAt: new Date().toISOString()
        };
        
        this.slides.push(newSlide);
        this.saveSlides();
        
        return newSlide;
    }
    
    removeSlide(slideId) {
        const index = this.slides.findIndex(s => s._id === slideId);
        if (index !== -1) {
            this.slides.splice(index, 1);
            // Reorder remaining slides
            this.reorderSlides();
            this.saveSlides();
            return true;
        }
        return false;
    }
    
    reorderSlides() {
        this.slides.forEach((slide, index) => {
            slide.order = index + 1;
        });
    }
    
    toggleSlide(slideId, makeActive) {
        const slide = this.slides.find(s => s._id === slideId);
        if (slide) {
            slide.active = makeActive;
            this.saveSlides();
            return true;
        }
        return false;
    }
    
    updateSlideOrder(slideId, newOrder) {
        const slide = this.slides.find(s => s._id === slideId);
        if (!slide) return false;
        
        // Update the moved slide
        slide.order = newOrder;
        
        // Re-sort all slides
        this.slides.sort((a, b) => a.order - b.order);
        
        // Reassign order numbers to ensure consistency
        this.reorderSlides();
        
        this.saveSlides();
        return true;
    }
    
    getActiveSlides() {
        return this.slides
            .filter(slide => slide.active)
            .sort((a, b) => a.order - b.order);
    }
    
    loadSlides() {
        try {
            const saved = localStorage.getItem('dynamicSlideshow');
            if (saved) {
                this.slides = JSON.parse(saved);
            } else {
                // Generate initial slides
                this.slides = this.generateSlidesFromMenuItems(this.settings.maxSlides);
                this.saveSlides();
            }
            
            return this.slides;
        } catch (error) {
            console.error('Error loading slides:', error);
            this.slides = this.generateSlidesFromMenuItems(this.settings.maxSlides);
            return this.slides;
        }
    }
    
    saveSlides() {
        localStorage.setItem('dynamicSlideshow', JSON.stringify(this.slides));
    }
    
    clearSlides() {
        this.slides = [];
        localStorage.removeItem('dynamicSlideshow');
    }
    
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        // If maxSlides changed, regenerate if needed
        if (newSettings.maxSlides && this.slides.length > newSettings.maxSlides) {
            this.slides = this.slides.slice(0, newSettings.maxSlides);
            this.reorderSlides();
            this.saveSlides();
        }
    }
    
    searchMenuItems(query) {
        const allItems = this.getAllMenuItems();
        if (!query) return allItems;
        
        const searchTerm = query.toLowerCase();
        return allItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
        );
    }
    
    filterItemsByCategory(category) {
        const allItems = this.getAllMenuItems();
        if (category === 'all') return allItems;
        return allItems.filter(item => item.category === category);
    }
    
    // For integration with main slideshow on homepage
    getSlideshowData() {
        const activeSlides = this.getActiveSlides();
        
        if (activeSlides.length === 0) {
            // Fallback to default slides if no active slides
            return [
                {
                    _id: 'slide_default',
                    title: 'Welcome to Ai-Maize-ing Nachos',
                    description: 'Your go-to spot for delicious nachos and desserts!',
                    imageUrl: 'image/logo.png',
                    order: 1,
                    active: true,
                    promoBadge: 'Welcome'
                }
            ];
        }
        
        return activeSlides;
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.slideshowManager = new SlideshowManager();
}