/**
 * Component Loader for Precious Meals & Bakes
 * Handles dynamic loading of HTML components
 */

// Function to load a component into a container
function loadComponent(containerId, componentPath) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    // Fetch the component HTML
    fetch(componentPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load component: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            // Insert the component HTML into the container
            container.innerHTML = html;
            
            // Dispatch an event to notify that the component has been loaded
            const event = new CustomEvent('componentLoaded', {
                detail: { containerId, componentPath }
            });
            document.dispatchEvent(event);
        })
        .catch(error => {
            console.error(`Error loading component '${componentPath}':`, error);
            container.innerHTML = `<div class="alert alert-danger">Failed to load component: ${error.message}</div>`;
        });
}
