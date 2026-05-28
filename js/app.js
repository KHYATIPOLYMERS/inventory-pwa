// Google Apps Script Web App URL (you'll replace this after deployment)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztfs4PKnqf3MYexqvoPziIDufJph8I4Cjwgg39jYTL2ppnCTOJR3Mo3Cbwb7fWLVFBFg/exec';

let inventoryData = [];

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed'));
}

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Show status message
function showStatus(message, type = 'success') {
    const statusDiv = document.getElementById('status-message');
    statusDiv.textContent = message;
    statusDiv.className = `status-message show ${type}`;
    
    setTimeout(() => {
        statusDiv.classList.remove('show');
    }, 3000);
}

// Add Product Form
document.getElementById('add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
        action: 'add',
        name: document.getElementById('product-name').value,
        code: document.getElementById('product-code').value,
        category: document.getElementById('category').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        price: parseFloat(document.getElementById('price').value) || 0,
        supplier: document.getElementById('supplier').value,
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus('Product added successfully!', 'success');
            e.target.reset();
        } else {
            showStatus('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showStatus('Error adding product. Check connection.', 'error');
        console.error(error);
    }
});

// Load Inventory
async function loadInventory() {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL + '?action=get');
        const result = await response.json();
        
        if (result.status === 'success') {
            inventoryData = result.data;
            displayInventory(inventoryData);
            showStatus('Inventory loaded successfully!', 'success');
        } else {
            showStatus('Error loading inventory', 'error');
        }
    } catch (error) {
        showStatus('Error loading data. Check connection.', 'error');
        console.error(error);
    }
}

// Display Inventory
function displayInventory(data) {
    const container = document.getElementById('inventory-list');
    
    if (data.length === 0) {
        container.innerHTML = '<p class="loading">No products in inventory</p>';
        return;
    }
    
    container.innerHTML = data.map(item => {
        const stockClass = item.quantity < 10 ? 'stock-low' : 
                          item.quantity < 50 ? 'stock-medium' : 'stock-good';
        
        return `
            <div class="inventory-item">
                <h3>${item.name}</h3>
                <p><strong>Code:</strong> ${item.code}</p>
                <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
                <p><strong>Supplier:</strong> ${item.supplier || 'N/A'}</p>
                <p><strong>Price:</strong> ₹${item.price || 0} per ${item.unit || 'unit'}</p>
                <p class="stock-level ${stockClass}">
                    <strong>Stock:</strong> ${item.quantity} ${item.unit || 'units'}
                </p>
            </div>
        `;
    }).join('');
}

// Filter Inventory
function filterInventory() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const filtered = inventoryData.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.code.toLowerCase().includes(searchTerm) ||
        (item.category && item.category.toLowerCase().includes(searchTerm))
    );
    displayInventory(filtered);
}

// Update Stock Form
document.getElementById('update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updateData = {
        action: 'update',
        code: document.getElementById('update-code').value,
        updateAction: document.getElementById('action').value,
        quantity: parseFloat(document.getElementById('update-quantity').value),
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString()
    };
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus('Stock updated successfully!', 'success');
            e.target.reset();
        } else {
            showStatus('Error: ' + result.message, 'error');
        }
    } catch (error) {
        showStatus('Error updating stock. Check connection.', 'error');
        console.error(error);
    }
});
