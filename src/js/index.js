import '../sass/styles.scss'
import Stage from './Stage'
import Layout from './Layout'

const APP = window.APP || {}

/*-----------------------------------------------------------------------------------*/
/*  01. INIT
/*-----------------------------------------------------------------------------------*/

const initApp = () => {
    window.APP = APP

    APP.Stage = new Stage()
    APP.Layout = new Layout()
    
    // Call the setup function after the window is fully loaded
    // This is to ensure all DOM elements, especially #side-navigation ul, are definitely available.
    window.addEventListener('load', setupSideNavigation)
}

// Moved Side Navigation Logic into its own function
const setupSideNavigation = () => {
    console.log('Side Nav: setupSideNavigation function called. document.readyState:', document.readyState);
    // console.log('Side Nav: document.body.innerHTML:', document.body.innerHTML); // Temporarily disable verbose log
    
    if (!APP.Stage || !APP.Stage.Scroll) {
        console.error('Side Nav CRITICAL: APP.Stage.Scroll is NOT AVAILABLE when setupSideNavigation is called. Aborting nav setup.');
        // Attempt to re-schedule or alert user, depending on desired robustness
        return;
    }
    console.log('Side Nav: APP.Stage.Scroll IS available.');

    const sideNavUL = document.querySelector('#side-navigation ul');
    const tiles = document.querySelectorAll('.slideshow-list__el');

    if (sideNavUL) {
        console.log('Side Nav: Found #side-navigation ul element.', sideNavUL);
        // Clear any manually added static LIs to prevent duplicates if script runs multiple times or if HTML had placeholders
        // sideNavUL.innerHTML = ''; // COMMENTED OUT - keeping static HTML items
    } else {
        console.error('Side Nav ERROR: #side-navigation ul element NOT FOUND. Cannot build navigation.');
        return; // Stop if UL is not found
    }

    if (tiles.length > 0) {
        console.log('Side Nav: Found tiles to process:', tiles.length);
    } else {
        console.warn('Side Nav WARNING: No .slideshow-list__el tiles found in the document. Navigation will be empty.');
        // Not necessarily an error, could be a page with no tiles
    }

    // Proceed with building nav items even if tiles.length is 0 (it will just be an empty list)
    // The core issue was querySelector failing, or scrollbar not ready.
    // Now we ensure UL exists and scrollbar is ready before this point.

    // const scrollbar = APP.Stage.Scroll; // Already confirmed above

    // Skip building dynamic navigation items - keep only static HTML items
    console.log('Side Nav: Skipping dynamic navigation building - using static HTML items only');
    return;

    tiles.forEach((tile, index) => {
        console.log(`Side Nav: Processing tile ${index}`, tile)
        const titleElement = tile.querySelector('.tile__title')
        console.log(`Side Nav: Tile ${index} - titleElement:`, titleElement)
        const titleText = titleElement ? titleElement.textContent.trim() : `Section ${index + 1}`
        console.log(`Side Nav: Tile ${index} - titleText:`, titleText)
        const tileId = `tile-section-${index}`
        tile.id = tileId

        const listItem = document.createElement('li')
        const link = document.createElement('a')
        link.href = `#${tileId}`
        link.textContent = titleText
        link.dataset.targetId = tileId
        console.log(`Side Nav: Tile ${index} - Created link:`, link)

        listItem.appendChild(link)
        sideNavUL.appendChild(listItem)
        console.log(`Side Nav: Tile ${index} - Appended to UL. Current UL children:`, sideNavUL.children.length)

        link.addEventListener('click', (e) => {
            e.preventDefault()
            const targetElement = document.getElementById(tileId)
            if (targetElement) {
                // Calculate the horizontal scroll position
                // scrollbar.scrollTo(targetX, targetY, duration)
                // For horizontal scroll, targetX is targetElement.offsetLeft relative to the scroll content
                let targetOffsetLeft = targetElement.offsetLeft
                
                // Adjust if the scrollable content has padding/margin that affects offsetLeft
                // This might need fine-tuning based on your exact CSS of .scrollarea > .slideshow-list
                const scrollContent = APP.Stage.Scroll.scrollElement
                if (scrollContent && scrollContent.firstElementChild === targetElement.parentElement) {
                     // if targetElement is a direct child of slideshow-list which is the scrollable part
                } else {
                    // More complex DOM, might need to sum up offsets
                }

                APP.Stage.Scroll.scrollTo(targetOffsetLeft, 0, 600) // 600ms duration
            }
        })
    })

    // Highlight active nav item on scroll
    APP.Stage.Scroll.addListener((status) => {
        let currentActiveFound = false
        tiles.forEach((tile) => {
            const link = sideNavUL.querySelector(`a[data-target-id="${tile.id}"]`)
            if (link) {
                const tileRect = tile.getBoundingClientRect()
                const scrollAreaRect = APP.Stage.Scroll.containerEl.getBoundingClientRect()
                
                // Check if tile is sufficiently visible in the horizontal scroll area
                // A tile is "active" if its left edge is past the scroll container's left edge,
                // but not too far past (e.g. more than half its width is visible)
                // and its right edge is before the scroll container's right edge,
                // or a significant portion is visible.
                const tileLeft = tileRect.left - scrollAreaRect.left
                const tileRight = tileRect.right - scrollAreaRect.left
                const tileWidth = tileRect.width

                // Consider active if the tile is at the beginning or a significant part of it is visible
                // and it's the first such tile from the left.
                if (!currentActiveFound && tileLeft < scrollAreaRect.width / 2 && tileRight > scrollAreaRect.width / 10) {
                    link.classList.add('active')
                    currentActiveFound = true
                } else {
                    link.classList.remove('active')
                }
            }
        })
         // If no tile was marked active (e.g., at the very end of scroll), mark the last one if appropriate
        if (!currentActiveFound && tiles.length > 0) {
            const lastTile = tiles[tiles.length-1]
            const lastTileLink = sideNavUL.querySelector(`a[data-target-id="${lastTile.id}"]`)
            const lastTileRect = lastTile.getBoundingClientRect()
            const scrollAreaRect = APP.Stage.Scroll.containerEl.getBoundingClientRect()
            if (lastTileRect.right <= scrollAreaRect.right + lastTileRect.width /2 && lastTileRect.right > scrollAreaRect.left) {
                 if(lastTileLink) lastTileLink.classList.add('active')
            }
        }
    })
}

if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    initApp()
} else {
    document.addEventListener('DOMContentLoaded', initApp)
}
