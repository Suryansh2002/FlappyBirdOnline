/**
 * 
 * @param {HTMLElement} element 
 * @param {number} x 
 * @param {number} y 
 */

export function renderBird(element, y, transform){
    let clientHeight = document.body.clientHeight;
    element.style.bottom = y/1000 * clientHeight + "px";
    if (transform){
        element.style.transform = transform;
    }
}

/**
 * @param {HTMLElement} element
 * @param {number} x
 * @param {number} y
 * @param {number} height
 * @param {string} state
 */
export function renderPipe(element, x, height, state){
    let clientHeight = document.body.clientHeight;
    element.style.left = x + "px";
    if (state === "straight"){
        element.style.bottom = 0;
        element.style.height = height/1000 * clientHeight + "px";
    } else {
        element.style.height = height/1010 * clientHeight + "px";
        element.style.top = 0;
        element.style.transform = "rotate(180deg)";
    }
}