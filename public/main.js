document.addEventListener('DOMContentLoaded', () => {
  const hasGSAP = typeof gsap !== 'undefined';
  if(hasGSAP){ gsap.registerPlugin(ScrollTrigger); }

  /* Hero load-in animation */
  if(hasGSAP){
    gsap.set('#hero-plate', { opacity:0, scale:0.7, rotateY: -35 });
    gsap.to('#hero-plate', { opacity:1, scale:1, rotateY:0, duration:1.2, ease:'power3.out', delay:0.2 });
    gsap.from('.hero-copy > *', { opacity:0, y:24, duration:0.9, stagger:0.12, ease:'power2.out', delay:0.15 });
  }

  /* Reveal on scroll for generic blocks */
  const revealEls = document.querySelectorAll('.reveal');
  if(hasGSAP){
    revealEls.forEach(el=>{
      gsap.to(el, {
        opacity:1, y:0, duration:0.9, ease:'power2.out',
        scrollTrigger: { trigger: el, start:'top 85%' }
      });
    });
    // steps stagger
    gsap.utils.toArray('.step').forEach((el,i)=>{
      gsap.to(el, { opacity:1, y:0, duration:0.8, delay:i*0.08, ease:'power2.out', scrollTrigger:{ trigger: el, start:'top 88%'} });
    });
  } else {
    revealEls.forEach(el=>{ el.style.opacity=1; el.style.transform='none'; });
  }

  /* 3D drum carousel, all devices */
  if(hasGSAP){
    const drum = document.getElementById('drum');
    const cards = gsap.utils.toArray('#drum .card3d');
    const dots = gsap.utils.toArray('#drum-dots span');
    const totalRot = -270; // full loop through 4 cards (90deg apart)

    function updateActive(rot){
      let norm = ((rot % 360) + 360) % 360;
      let idx = Math.round(norm / 90) % 4;
      idx = (4 - idx) % 4; // account for negative rotation direction
      
      cards.forEach((c,i)=> {
        const isActive = i === idx;
        c.classList.toggle('is-active', isActive);
        // Apply scaling only via GSAP to not conflict with rotateY
        gsap.to(c, { scale: isActive ? 1.05 : 1, duration: 0.3, ease: 'power2.out' });
      });
      dots.forEach((d,i)=> d.classList.toggle('active', i===idx));
    }
    updateActive(0);

    gsap.to(drum, {
      rotateY: totalRot,
      ease:'none',
      scrollTrigger:{
        trigger: '.drum-stage',
        start:'center center',
        end:'+=200%',
        scrub:0.6,
        pin:true,
        onUpdate: (self)=> updateActive(totalRot * self.progress)
      }
    });
  }

  /* Smooth Scroll and Prefill Select from Product Buttons */
  const productSelect = document.querySelector('select[name="product"]');
  document.querySelectorAll('.pick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Find the corresponding tag or h3 for the product name
      const card = btn.closest('.card3d');
      if(card && productSelect) {
        // Custom matching since options might not perfectly match h3
        const tag = card.querySelector('.tag').textContent.toLowerCase();
        if(tag.includes('google')) productSelect.selectedIndex = 1;
        else if(tag.includes('меню')) productSelect.selectedIndex = 2;
        else if(tag.includes('instagram')) productSelect.selectedIndex = 3;
        else if(tag.includes('застосунок')) productSelect.selectedIndex = 4;
      }
    });
  });



  /* Upload zone with validation and preview */
  const uploadZone = document.getElementById('upload-zone');
  const logoInput = document.getElementById('logo-input');
  const uploadLabel = document.getElementById('upload-label');
  const allowedExtensions = ['png', 'jpg', 'jpeg', 'svg', 'ai', 'eps', 'pdf'];
  
  // Create preview image element if not exists
  let previewImg = document.getElementById('upload-preview');
  if(!previewImg) {
    previewImg = document.createElement('img');
    previewImg.id = 'upload-preview';
    previewImg.className = 'upload-preview';
    uploadZone.appendChild(previewImg);
  }

  ['dragenter','dragover'].forEach(evt=> uploadZone.addEventListener(evt, e=>{ e.preventDefault(); uploadZone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(evt=> uploadZone.addEventListener(evt, e=>{ e.preventDefault(); uploadZone.classList.remove('drag'); }));
  
  uploadZone.addEventListener('drop', e=>{
    if(e.dataTransfer.files.length){ 
      logoInput.files = e.dataTransfer.files; 
      updateUploadLabel(); 
    }
  });
  
  logoInput.addEventListener('change', updateUploadLabel);
  
  function updateUploadLabel(){
    uploadZone.classList.remove('error');
    if(logoInput.files.length > 0) {
      const file = logoInput.files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      
      if(!allowedExtensions.includes(ext)) {
        uploadZone.classList.add('error');
        uploadLabel.textContent = "Непідтримуваний формат файлу. Оберіть .png, .jpg, .svg, .ai, .eps, або .pdf";
        logoInput.value = ""; // clear
        previewImg.classList.remove('show');
        return;
      }
      
      uploadLabel.textContent = file.name;
      
      // Show preview for images
      if(['png', 'jpg', 'jpeg', 'svg'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewImg.classList.add('show');
        }
        reader.readAsDataURL(file);
      } else {
        previewImg.classList.remove('show');
      }
    } else {
      uploadLabel.textContent = "Перетягни файл або натисни, щоб обрати";
      previewImg.classList.remove('show');
    }
  }

  /* Order form -> Vercel Serverless Function */
  const form = document.getElementById('order-form');
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  const submitBtn = document.getElementById('submit-btn');

  function showToast(msg, ok){
    const toastIc = toast.querySelector('.toast-ic');
    if(ok) {
      toastIc.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34A853" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      toast.style.borderColor = 'rgba(52,168,83,0.4)';
    } else {
      toastIc.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA4335" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      toast.style.borderColor = 'rgba(234,67,53,0.4)';
    }
    toastText.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 4000);
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    
    // Check file valid again just in case
    if(uploadZone.classList.contains('error')) {
      showToast('Будь ласка, оберіть правильний формат файлу.', false);
      return;
    }

    const data = new FormData(form);

    submitBtn.disabled = true;
    submitBtn.textContent = 'Надсилаємо...';

    try{
      const res = await fetch('/api/send-order', {
        method: 'POST',
        body: data // Sending as multipart/form-data directly
      });
      
      const result = await res.json();
      
      if(!res.ok || !result.success) {
        throw new Error(result.error || 'Server error');
      }
      
      showToast('Замовлення надіслано! Ми скоро зв\u2019яжемось.', true);
      form.reset();
      updateUploadLabel();
    }catch(err){
      console.error(err);
      showToast('Не вдалось надіслати. Спробуйте ще раз.', false);
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = 'Відправити замовлення менеджеру';
    }
  });
});
