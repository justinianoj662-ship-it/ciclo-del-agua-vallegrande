(function(){
  const answers={q1:'b',q2:'v',q3:'a',q4:'f',q5:'a'};
  const explanations={q1:'Evaporación: el agua pasa de líquido a vapor por calor.',q2:'Verdadero: la infiltración recarga acuíferos.',q3:'La precipitación excesiva puede causar inundaciones y pérdida de cultivos.',q4:'Falso: el agua subterránea puede volver a la superficie.',q5:'Combinar saberes locales con ciencia permite soluciones adaptadas.'};
  window.gradeQuiz=function(){let score=0,total=5;for(const k in answers){const sel=document.querySelector('input[name="'+k+'"]:checked');const feed=document.querySelector('.feedback[data-q="'+k+'"]');if(!feed) continue; if(sel){ if(sel.value===answers[k]){score++; feed.innerText='✅ Correcto. '+explanations[k]; feed.style.color='green'; } else { feed.innerText='❌ Incorrecto. '+explanations[k]; feed.style.color='crimson'; } } else { feed.innerText='ℹ️ Selecciona una opción.'; feed.style.color='#555'; }} const pct=Math.round((score/total)*100); const res=document.getElementById('result'); res.innerText='Tu puntaje: '+score+'/'+total+' ('+pct+'%).'; if(pct===100) res.innerText+=' ¡Excelente! Propón una acción local.';};
  window.resetQuiz=function(){document.getElementById('quizForm').reset(); document.querySelectorAll('.feedback').forEach(e=>e.innerText=''); document.getElementById('result').innerText='';};

  // PDF generation using jsPDF
  const { jsPDF } = window.jspdf;
  document.getElementById('generatePdf').addEventListener('click', async function(){
    const name=document.getElementById('studentName').value || 'Sin_nombre';
    const fileInput=document.getElementById('projectImage');
    const msg=document.getElementById('projectMsg');
    if(!fileInput.files || !fileInput.files[0]){ msg.innerText='Por favor adjunta una foto.'; return; }
    msg.innerText='Generando PDF...';
    const doc=new jsPDF({unit:'pt',format:'a4'});
    const pageW=doc.internal.pageSize.getWidth();
    doc.setFillColor(0,119,182); doc.rect(40,20,pageW-80,60,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(18); doc.text('Informe de proyecto - Monitoreo de la microcuenca',60,56);
    doc.setFontSize(12); doc.text('Autor/Grupo: '+name,60,76);
    // image to dataURL
    const imgData=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=function(e){ resolve(e.target.result); };
      reader.onerror=reject;
      reader.readAsDataURL(fileInput.files[0]);
    });
    // add image scaled
    const imgProps=doc.getImageProperties(imgData);
    let imgW=imgProps.width, imgH=imgProps.height;
    const maxImgW=pageW-120; const scale=Math.min(maxImgW/imgW,500/imgH,1);
    imgW=imgW*scale; imgH=imgH*scale;
    let y = 120;
    doc.addImage(imgData,'JPEG',60,y,imgW,imgH);
    // footer
    doc.setFillColor(0,119,182); doc.rect(40, doc.internal.pageSize.getHeight()-80, pageW-80, 60, 'F');
    doc.setTextColor(255,255,255); doc.text('Creado por Lic. Jonathan Arturo Justiniano Escobar',60,doc.internal.pageSize.getHeight()-50);
    doc.save((name.replace(/\s+/g,'_')||'informe') + '_Vallegrande.pdf');
    msg.innerText='PDF generado y descargado.';
  });

  document.getElementById('printPdf').addEventListener('click', function(){
    const name=document.getElementById('studentName').value || 'Sin nombre';
    const fileInput=document.getElementById('projectImage');
    const win=window.open('','_blank');
    win.document.write('<html><head><title>Informe - '+name+'</title><style>body{font-family:Arial;padding:30px;color:#023047}.header{background:#0077b6;color:#fff;padding:10px;border-radius:6px}</style></head><body>');
    win.document.write('<div class="header"><h2>Informe</h2><p>Autor: '+name+'</p></div>');
    if(fileInput.files && fileInput.files[0]){
      const reader=new FileReader();
      reader.onload=function(e){ win.document.write('<img src="'+e.target.result+'" style="max-width:100%"><p>'); win.document.close(); win.focus(); win.print(); };
      reader.readAsDataURL(fileInput.files[0]);
    } else { win.document.close(); win.focus(); win.print(); }
  });

})();




// --- Nuevas funciones interactivas con ZIP ---
document.addEventListener('DOMContentLoaded', function() {
  // Cargar JSZip dinámicamente desde CDN
  const script = document.createElement('script');
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
  document.head.appendChild(script);

  // Reveal-on-scroll
  const reveals = document.querySelectorAll('.reveal');
  function revealAll() {
    const h = window.innerHeight;
    reveals.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < h - 60) el.classList.add('visible');
    });
  }
  revealAll();
  window.addEventListener('scroll', revealAll);
  window.addEventListener('resize', revealAll);

  const uploadForm = document.getElementById('uploadForm');
  const taskFile = document.getElementById('taskFile');
  const studentName = document.getElementById('studentName');
  const uploadMessage = document.getElementById('uploadMessage');
  const clearBtn = document.getElementById('clearBtn');

  if (uploadForm) {
    uploadForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      uploadMessage.textContent = '';

      const name = studentName.value.trim();
      const file = taskFile.files[0];
      if (!name) { uploadMessage.textContent = 'Por favor ingresa tu nombre.'; return; }
      if (!file) { uploadMessage.textContent = 'Selecciona un archivo PDF.'; return; }
      if (file.type !== 'application/pdf') { uploadMessage.textContent = 'El archivo debe ser un PDF.'; return; }
      if (file.size > 10 * 1024 * 1024) { uploadMessage.textContent = 'El archivo supera 10 MB.'; return; }

      uploadMessage.textContent = 'Generando comprobante ZIP...';

      // Esperar a que JSZip esté cargado
      if (typeof JSZip === "undefined") {
        await new Promise(res => script.onload = res);
      }

      const zip = new JSZip();

      // Añadir metadata
      const metadata = {
        student: name,
        filename: file.name,
        size_bytes: file.size,
        uploaded_at: new Date().toISOString(),
        course: 'Ciencias Sociales - Vallegrande (actividad ciclo del agua)'
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      // Añadir el PDF como binario
      const fileData = await file.arrayBuffer();
      zip.file(file.name, fileData);

      // Generar el ZIP y descargarlo
      zip.generateAsync({type: "blob"}).then(function(content) {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g,'_')}_comprobante.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        uploadMessage.textContent = '¡ZIP generado y descargado! Envíalo a tu docente para confirmar tu entrega.';
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      studentName.value = '';
      taskFile.value = '';
      uploadMessage.textContent = '';
    });
  }
});
