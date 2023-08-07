import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onChildChanged, onChildAdded, update, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const firebaseConfig = {
    databaseURL: 'https://realtime-database-8c9e0-default-rtdb.firebaseio.com/'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Realtime database and get reference to service
const database = getDatabase(app);
// Endorsements database 
const endorsementsRef = ref(database, 'endorsements');

// Constants
const FILLED_HEART = 'fa-solid';
const EMPTY_HEART = 'fa-regular';

// Queried elements
const endorsementFormEl = document.getElementById('endorsement-form');
const toInputEl = document.getElementById('to-input');
const fromInputEl = document.getElementById('from-input');
const textAreaEl = document.getElementById('endorsement-text');
const endorsementsContainerEl = document.getElementById('endorsements');

get(endorsementsRef).then((snapshot) => {
    if (snapshot.exists() && snapshot.hasChildren()) {
        // Clear container of articles
        endorsementsContainerEl.innerHTML = '';
        // Get snapshot and convert to an array
        let snapshotArray = Object.entries(snapshot.val());
        
        // Sort newest to oldest
        const sortedArray = snapshotArray.sort( (a, b) => {
            const dateA = new Date(a[1].timestamp);
            const dateB = new Date(b[1].timestamp);
            
            return dateB - dateA; 
        });
        
        const renderedEls = sortedArray.map((currentItem) => {
            return renderEndorsement(currentItem);     
        });
        
        endorsementsContainerEl.append(...renderedEls);
    } else {
        const noEndorsementsH3 = document.createElement('h3');
        noEndorsementsH3.textContent = 'Be the first to endorse someone!';
        
        endorsementsContainerEl.append(noEndorsementsH3);
    }
}).catch((error) => {
    console.error(error);
});

onChildChanged(endorsementsRef, (snapshot) => {
    const changedChildData = snapshot.val();
    const changedChildKey = snapshot.key;

    // Create unique id for each endorsement
    const uniqueId = `${changedChildData.timestamp}`.slice(0, 5) + changedChildKey.slice(-5);
    // Replace previous article element with updated article element
    const oldArticle = document.querySelector(`[data-id="${uniqueId}"]`);
    const parentEl = oldArticle.parentElement;
    const newArticle = renderEndorsement([changedChildKey, changedChildData]);
    parentEl.replaceChild(newArticle, oldArticle);
});

onChildAdded(endorsementsRef, (snapshot) => {   
    const newChildDbItem = [snapshot.key, snapshot.val()];
    const newArticle = renderEndorsement(newChildDbItem);
    
    endorsementsContainerEl.prepend(newArticle);
});

// Event listener(s)
endorsementFormEl.addEventListener('submit', (event) => {
    event.preventDefault();
    // Create item in Firebase
    push(endorsementsRef, {
        timestamp: Date.now(),
        sender: fromInputEl.value,
        recipient: toInputEl.value,
        text: textAreaEl.value,
        likes: 0
    });
    // Clear inputs
    resetForm();
});

function renderEndorsement(item) {
    const [id, dbObject] = item;
    
    // Create elements
    const article = document.createElement('article');
    const h2To = document.createElement('h2');
    const pText = document.createElement('p');
    const div1 = document.createElement('div');
    const h2From = document.createElement('h2');
    const div2 = document.createElement('div');
    const i = document.createElement('i');
    const span = document.createElement('span');
       
    // Populate elements with endorsement data
    h2To.textContent = `To ${dbObject.recipient}`;
    pText.textContent = dbObject.text;
    h2From.textContent = `From ${dbObject.sender}`;
    span.textContent = dbObject.likes;
    
    // Create unique ID
    const uniqueId = `${dbObject.timestamp}`.slice(0, 5) + id.slice(-5);
    // Set attributes
    article.setAttribute('data-id', `${uniqueId}`);
    h2To.classList.add('to-heading');
    pText.classList.add('text-paragraph');
    h2From.classList.add('from-heading');
    div1.classList.add('heading-and-likes-container');
    div2.classList.add('likes-container');
    
    const heartIconType = itemInLocalStorage(id) ? FILLED_HEART : EMPTY_HEART;
    i.classList.add(heartIconType, 'fa-heart'); 
    
    // Event listener for the heart
    i.addEventListener('click', (event) => {
        // Create local variable within this closure to track state
        let isInLocalStorage = itemInLocalStorage(id);
        
        updateLikeCount(id, dbObject, isInLocalStorage, event.target);
    });
    
    // Append elements to their respective containers                
    div2.append(i, span);
    div1.append(h2From, div2);
    article.append(h2To, pText, div1);
    
    return article;
}

function updateLikeCount(itemID, databaseObj, inLocalStorage, targetEl) {
    let currentLikeCount = databaseObj.likes;
    let newLikeCount = inLocalStorage ? currentLikeCount -= 1 : currentLikeCount += 1;
    
    newLikeCount = Math.max(0, newLikeCount);
    
    if (inLocalStorage) {
        // Remove from local storage
        localStorage.removeItem(itemID);
        // Change font icon from filled to outline heart
        targetEl.classList.remove(FILLED_HEART);
        targetEl.classList.add(EMPTY_HEART);
    } else {
        // Save to local storage
        localStorage.setItem(itemID, JSON.stringify(true));
        // Change font icon from outline to filled heart
        targetEl.classList.remove(EMPTY_HEART);
        targetEl.classList.add(FILLED_HEART);
    }
    
    update(ref(database, `endorsements/${itemID}`), {likes: newLikeCount} );
}

function itemInLocalStorage(itemID) {
    return localStorage.getItem(itemID);
}

function resetForm() {
    fromInputEl.value = '';
    toInputEl.value = '';
    textAreaEl.value = '';
}