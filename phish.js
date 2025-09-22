
const leftCard = document.getElementById('leftCard');
const rightCard = document.getElementById('rightCard');
const feedback = document.getElementById('feedback');
const resetBtn = document.getElementById('reset');

const phishSide = 'left'; // mark which side is phishing

function handleChoice(side){
  if (side === phishSide){
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

leftCard.addEventListener('click', ()=>handleChoice('left'));
rightCard.addEventListener('click', ()=>handleChoice('right'));

resetBtn.addEventListener('click', ()=>{
  leftCard.className='card';
  rightCard.className='card';
  feedback.textContent='';
  leftCard.style.pointerEvents = 'auto';
  rightCard.style.pointerEvents = 'auto';
  resetBtn.style.display = 'none';
});
