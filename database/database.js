/**
 * Hybrid Database for Precious Meals & Bakes
 * This file provides both local storage functionality and online syncing
 * to replace Firebase while maintaining online capabilities
 */

// API endpoint for our JSON server
// For demonstration, we'll use a mock API that simulates online behavior
// In a production environment, this would be replaced with your actual API endpoint
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

// Hybrid database implementation (local + online sync)
const HybridDatabase = {
    // Storage keys
    storageKeys: {
        bookings: 'precious_meals_bookings',
        users: 'precious_meals_users',
        nextBookingId: 'precious_meals_next_booking_id'
    },

    // Initialize the database with default data if empty
    init: function() {
        // Initialize bookings if not exists
        if (!localStorage.getItem(this.storageKeys.bookings)) {
            localStorage.setItem(this.storageKeys.bookings, JSON.stringify([]));
        }
        
        // Initialize users if not exists
        if (!localStorage.getItem(this.storageKeys.users)) {
            localStorage.setItem(this.storageKeys.users, JSON.stringify([]));
        }
        
        // Initialize booking ID counter if not exists
        if (!localStorage.getItem(this.storageKeys.nextBookingId)) {
            localStorage.setItem(this.storageKeys.nextBookingId, '1');
        }
    },
    
    // Get next booking ID and increment counter
    getNextBookingId: function() {
        const nextId = localStorage.getItem(this.storageKeys.nextBookingId);
        const bookingId = `booking_${nextId}`;
        // Increment for next use
        localStorage.setItem(this.storageKeys.nextBookingId, (parseInt(nextId) + 1).toString());
        return bookingId;
    },
    
    // Online sync methods
    sync: {
        // Sync local data to server
        pushToServer: async function(collectionName) {
            try {
                const storageKey = collectionName === 'bookings' 
                    ? HybridDatabase.storageKeys.bookings 
                    : HybridDatabase.storageKeys.users;
                
                // Get local data
                const localData = JSON.parse(localStorage.getItem(storageKey)) || [];
                
                // Push to server
                const response = await fetch(`${API_BASE_URL}/${collectionName}`, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    // Get server data
                    const serverData = await response.json();
                    
                    // Find items that are in local but not in server
                    const itemsToAdd = localData.filter(localItem => 
                        !serverData.some(serverItem => serverItem.id === localItem.id)
                    );
                    
                    // Add new items to server
                    for (const item of itemsToAdd) {
                        await fetch(`${API_BASE_URL}/${collectionName}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(item)
                        });
                    }
                    
                    console.log(`Synced ${itemsToAdd.length} items to server`);
                    return true;
                } else {
                    console.error('Failed to sync with server');
                    return false;
                }
            } catch (error) {
                console.error('Error syncing with server:', error);
                return false;
            }
        },
        
        // Pull data from server to local
        pullFromServer: async function(collectionName) {
            try {
                const storageKey = collectionName === 'bookings' 
                    ? HybridDatabase.storageKeys.bookings 
                    : HybridDatabase.storageKeys.users;
                
                // Get data from server
                const response = await fetch(`${API_BASE_URL}/${collectionName}`);
                
                if (response.ok) {
                    // Get server data
                    const serverData = await response.json();
                    
                    // Get local data
                    const localData = JSON.parse(localStorage.getItem(storageKey)) || [];
                    
                    // Merge data (prefer server data for conflicts)
                    const mergedData = [...localData];
                    
                    for (const serverItem of serverData) {
                        const localIndex = mergedData.findIndex(item => item.id === serverItem.id);
                        
                        if (localIndex !== -1) {
                            // Update existing item
                            mergedData[localIndex] = serverItem;
                        } else {
                            // Add new item
                            mergedData.push(serverItem);
                        }
                    }
                    
                    // Save merged data to local storage
                    localStorage.setItem(storageKey, JSON.stringify(mergedData));
                    
                    console.log(`Pulled ${serverData.length} items from server`);
                    return true;
                } else {
                    console.error('Failed to pull data from server');
                    return false;
                }
            } catch (error) {
                console.error('Error pulling data from server:', error);
                return false;
            }
        },
        
        // Sync both ways
        syncBidirectional: async function(collectionName) {
            // First push local changes to server
            await this.pushToServer(collectionName);
            
            // Then pull server changes to local
            await this.pullFromServer(collectionName);
        }
    },
    
    // Collection operations (mimicking Firebase collections)
    collection: {
        // Add a document to a collection
        addDoc: function(collectionName, data) {
            return new Promise(async (resolve, reject) => {
                try {
                    const storageKey = collectionName === 'bookings' 
                        ? HybridDatabase.storageKeys.bookings 
                        : HybridDatabase.storageKeys.users;
                    
                    // Get current collection data
                    const collectionData = JSON.parse(localStorage.getItem(storageKey)) || [];
                    
                    // Create a new document with ID
                    const newDoc = {
                        id: collectionName === 'bookings' 
                            ? HybridDatabase.getNextBookingId()
                            : `user_${Date.now()}`,
                        ...data,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Add to collection
                    collectionData.push(newDoc);
                    
                    // Save back to localStorage
                    localStorage.setItem(storageKey, JSON.stringify(collectionData));
                    
                    // Try to sync with server
                    try {
                        // Add to server directly
                        const response = await fetch(`${API_BASE_URL}/${collectionName}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(newDoc)
                        });
                        
                        if (response.ok) {
                            console.log(`Document added to server: ${newDoc.id}`);
                        } else {
                            console.warn(`Failed to add document to server: ${newDoc.id}`);
                        }
                    } catch (syncError) {
                        console.warn(`Server sync failed, will sync later: ${syncError.message}`);
                    }
                    
                    // Return the new document
                    resolve(newDoc);
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        // Get all documents from a collection
        getDocs: function(collectionName) {
            return new Promise((resolve, reject) => {
                try {
                    const storageKey = collectionName === 'bookings' 
                        ? HybridDatabase.storageKeys.bookings 
                        : HybridDatabase.storageKeys.users;
                    
                    // Get current collection data
                    const collectionData = JSON.parse(localStorage.getItem(storageKey)) || [];
                    
                    // Format response to mimic Firebase
                    const docs = collectionData.map(doc => ({
                        id: doc.id,
                        data: () => ({ ...doc })
                    }));
                    
                    // Return the documents
                    resolve({
                        docs: docs,
                        forEach: (callback) => docs.forEach(callback),
                        empty: docs.length === 0,
                        size: docs.length
                    });
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        // Query documents in a collection
        query: function(collectionName, filters = [], sortOptions = []) {
            return new Promise((resolve, reject) => {
                try {
                    const storageKey = collectionName === 'bookings' 
                        ? HybridDatabase.storageKeys.bookings 
                        : HybridDatabase.storageKeys.users;
                    
                    // Get current collection data
                    let collectionData = JSON.parse(localStorage.getItem(storageKey)) || [];
                    
                    // Apply filters
                    if (filters.length > 0) {
                        collectionData = collectionData.filter(doc => {
                            return filters.every(filter => {
                                const { field, operator, value } = filter;
                                
                                switch (operator) {
                                    case '==':
                                        return doc[field] === value;
                                    case '!=':
                                        return doc[field] !== value;
                                    case '>':
                                        return doc[field] > value;
                                    case '>=':
                                        return doc[field] >= value;
                                    case '<':
                                        return doc[field] < value;
                                    case '<=':
                                        return doc[field] <= value;
                                    default:
                                        return true;
                                }
                            });
                        });
                    }
                    
                    // Apply sorting
                    if (sortOptions.length > 0) {
                        collectionData.sort((a, b) => {
                            for (const sort of sortOptions) {
                                const { field, direction } = sort;
                                const modifier = direction === 'desc' ? -1 : 1;
                                
                                if (a[field] < b[field]) return -1 * modifier;
                                if (a[field] > b[field]) return 1 * modifier;
                            }
                            return 0;
                        });
                    }
                    
                    // Format response to mimic Firebase
                    const docs = collectionData.map(doc => ({
                        id: doc.id,
                        data: () => ({ ...doc })
                    }));
                    
                    // Return the documents
                    resolve({
                        docs: docs,
                        forEach: (callback) => docs.forEach(callback),
                        empty: docs.length === 0,
                        size: docs.length
                    });
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        // Update a document
        updateDoc: function(collectionName, docId, updateData) {
            return new Promise(async (resolve, reject) => {
                try {
                    const storageKey = collectionName === 'bookings' 
                        ? HybridDatabase.storageKeys.bookings 
                        : HybridDatabase.storageKeys.users;
                    
                    // Get current collection data
                    const collectionData = JSON.parse(localStorage.getItem(storageKey)) || [];
                    
                    // Find the document index
                    const docIndex = collectionData.findIndex(item => item.id === docId);
                    
                    if (docIndex !== -1) {
                        // Update the document
                        collectionData[docIndex] = {
                            ...collectionData[docIndex],
                            ...updateData,
                            updatedAt: new Date().toISOString()
                        };
                        
                        // Save back to localStorage
                        localStorage.setItem(storageKey, JSON.stringify(collectionData));
                        
                        // Try to sync with server
                        try {
                            // Update on server
                            const response = await fetch(`${API_BASE_URL}/${collectionName}/${docId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(collectionData[docIndex])
                            });
                            
                            if (response.ok) {
                                console.log(`Document updated on server: ${docId}`);
                            } else {
                                console.warn(`Failed to update document on server: ${docId}`);
                            }
                        } catch (syncError) {
                            console.warn(`Server sync failed for update, will sync later: ${syncError.message}`);
                        }
                        
                        // Return success
                        resolve({
                            id: docId,
                            data: () => ({ ...collectionData[docIndex] })
                        });
                    } else {
                        // Document not found
                        reject(new Error(`Document with ID ${docId} not found`));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        // Delete a document
        deleteDoc: function(collectionName, docId) {
            return new Promise(async (resolve, reject) => {
                try {
                    const storageKey = collectionName === 'bookings' 
                        ? HybridDatabase.storageKeys.bookings 
                        : HybridDatabase.storageKeys.users;
                    
                    // Get current collection data
                    const collectionData = JSON.parse(localStorage.getItem(storageKey)) || [];
                    
                    // Find the document index
                    const docIndex = collectionData.findIndex(item => item.id === docId);
                    
                    if (docIndex !== -1) {
                        // Remove the document
                        collectionData.splice(docIndex, 1);
                        
                        // Save back to localStorage
                        localStorage.setItem(storageKey, JSON.stringify(collectionData));
                        
                        // Try to sync with server
                        try {
                            // Delete from server
                            const response = await fetch(`${API_BASE_URL}/${collectionName}/${docId}`, {
                                method: 'DELETE'
                            });
                            
                            if (response.ok) {
                                console.log(`Document deleted from server: ${docId}`);
                            } else {
                                console.warn(`Failed to delete document from server: ${docId}`);
                            }
                        } catch (syncError) {
                            console.warn(`Server sync failed for delete, will sync later: ${syncError.message}`);
                        }
                        
                        // Return success
                        resolve({ success: true });
                    } else {
                        // Document not found
                        reject(new Error(`Document with ID ${docId} not found`));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }
    },
    
    // Document operations
    document: {
        // Get a document by ID
        getDoc: function(collectionName, docId) {
            return new Promise((resolve, reject) => {
                try {
                    const storageKey = collectionName === 'bookings' 
                        ? HybridDatabase.storageKeys.bookings 
                        : HybridDatabase.storageKeys.users;
                    
                    // Get current collection data
                    const collectionData = JSON.parse(localStorage.getItem(storageKey)) || [];
                    
                    // Find the document
                    const doc = collectionData.find(item => item.id === docId);
                    
                    if (doc) {
                        // Return the document in Firebase format
                        resolve({
                            id: doc.id,
                            data: () => ({ ...doc }),
                            exists: true
                        });
                    } else {
                        // Document not found
                        resolve({
                            exists: false,
                            data: () => null
                        });
                    }
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        // Update a document
        updateDoc: function(collectionName, docId, updateData) {
            return HybridDatabase.collection.updateDoc(collectionName, docId, updateData);
        },
        
        // Delete a document
        deleteDoc: function(collectionName, docId) {
            return HybridDatabase.collection.deleteDoc(collectionName, docId);
        }
    },
    
    // Query builders (to mimic Firebase query)
    where: function(field, operator, value) {
        return { field, operator, value };
    },
    
    orderBy: function(field, direction = 'asc') {
        return { field, direction };
    },
    
    // Export function to allow data backup
    exportData: function() {
        return {
            bookings: JSON.parse(localStorage.getItem(this.storageKeys.bookings) || '[]'),
            users: JSON.parse(localStorage.getItem(this.storageKeys.users) || '[]')
        };
    },
    
    // Import function to restore data
    importData: function(data) {
        if (data.bookings) {
            localStorage.setItem(this.storageKeys.bookings, JSON.stringify(data.bookings));
        }
        if (data.users) {
            localStorage.setItem(this.storageKeys.users, JSON.stringify(data.users));
        }
    }
};

// Initialize the database
HybridDatabase.init();

// Export the database API
export { 
    HybridDatabase
};

// Export functions to mimic Firebase API
export const collection = (name) => ({ name });
export const addDoc = (collRef, data) => HybridDatabase.collection.addDoc(collRef.name, data);
export const getDocs = (collRef) => HybridDatabase.collection.getDocs(collRef.name);
export const query = (collRef, ...args) => {
    const filters = args.filter(arg => arg.field && arg.operator && arg.value !== undefined);
    const sortOptions = args.filter(arg => arg.field && arg.direction);
    return HybridDatabase.collection.query(collRef.name, filters, sortOptions);
};
export const where = HybridDatabase.where;
export const orderBy = HybridDatabase.orderBy;
export const doc = (collRef, id) => ({ collection: collRef.name, id });
export const getDoc = (docRef) => HybridDatabase.document.getDoc(docRef.collection, docRef.id);
export const updateDoc = (docRef, data) => HybridDatabase.document.updateDoc(docRef.collection, docRef.id, data);
export const deleteDoc = (docRef) => HybridDatabase.document.deleteDoc(docRef.collection, docRef.id);
