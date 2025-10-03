const leftCard = document.getElementById('leftCard');
const rightCard = document.getElementById('rightCard');
const feedback = document.getElementById('feedback');
const resetBtn = document.getElementById('reset');

// Define multiple email sets
// Each set has two images and which side is phishing
const emailSets = [
  { left: "left1.png", right: "right1.png", phish: "left" },
  { left: "left2.png", right: "right2.png", phish: "right" },
  { left: "left3.png", right: "right3.png", phish: "left" },
  { left: "left4.png", right: "right4.png", phish: "right" }
  // ➕ add more sets here
];

let currentIndex = 0;
let currentSet;

// Load the current set by index
function loadSet(index){
  currentSet = emailSets[index];
  leftCard.querySelector("img").src = currentSet.left;
  rightCard.querySelector("img").src = currentSet.right;
  leftCard.className='card';
  rightCard.className='card';
  feedback.textContent='';
  leftCard.style.pointerEvents = 'auto';
  rightCard.style.pointerEvents = 'auto';
  resetBtn.style.display = 'none';
}

function handleChoice(side){
  if (side === currentSet.phish){
    feedback.textContent = "✅ Correct! You spotted the phishing email.";
    (side==='left'?leftCard:rightCard).classList.add('correct');
    (side==='left'?rightCard:leftCard).classList.add('incorrect');
  } else {
    feedback.textContent = "❌ Incorrect. That was a legitimate email. Review the phishing cues carefully.";
    (side==='left'?leftCard:rightCard).classList.add('incorrect');
    (side==='left'?rightCard:leftCard).classList.add('correct');
  }
  leftCard.style.pointerEvents = 'none';
  rightCard.style.pointerEvents = 'none';
  resetBtn.style.display = 'inline-block';
}

// Move to the next set in sequence
resetBtn.addEventListener('click', ()=>{
  currentIndex = (currentIndex + 1) % emailSets.length;
  loadSet(currentIndex);
});

// Event listeners for choices
leftCard.addEventListener('click', ()=>handleChoice('left'));
rightCard.addEventListener('click', ()=>handleChoice('right'));

// Start with the first set
loadSet(currentIndex);
