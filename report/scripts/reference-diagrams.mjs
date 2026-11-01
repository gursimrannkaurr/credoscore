// Fixed, editable vector layouts following the reference report's diagram grammar.
// Coordinates are deliberate: report figures must remain readable at A4 width.
const C = { blue: '#edf2fc', green: '#e8f5e7', yellow: '#fff6d9', red: '#fce8e8', grey: '#d9d9d9' };
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function drawing(w, h) {
  const parts = [];
  const text = (x, y, value, size = 13, anchor = 'middle', bold = false) => {
    const lines = value.split('\n');
    parts.push(`<text x="${x}" y="${y - (lines.length - 1) * size * .58}" font-size="${size}" text-anchor="${anchor}" font-weight="${bold ? 700 : 400}">${lines.map((s, i) => `<tspan x="${x}" dy="${i ? size * 1.16 : 0}">${esc(s)}</tspan>`).join('')}</text>`);
  };
  const rect = (x,y,w,h,label,fill='white',size=13,round=0) => {
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${round}" fill="${fill}" stroke="#444"/>`);
    if(label) text(x+w/2,y+h/2+4,label,size);
  };
  const oval = (x,y,rx,ry,label,fill='white',size=13) => {
    parts.push(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#444"/>`);
    if(label) text(x,y+4,label,size);
  };
  const line = (x1,y1,x2,y2,arrow=false,dash=false) => parts.push(`<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="#444" ${arrow?'marker-end="url(#arrow)"':''} ${dash?'stroke-dasharray="5 4"':''}/>`);
  const path = (d,arrow=false) => parts.push(`<path d="${d}" fill="none" stroke="#444" ${arrow?'marker-end="url(#arrow)"':''}/>`);
  const actor = (x,y,label) => {
    parts.push(`<circle cx="${x}" cy="${y}" r="11" fill="white" stroke="#333" stroke-width="1.5"/>`);
    path(`M${x},${y+11} V${y+43} M${x-21},${y+24} H${x+21} M${x},${y+43} L${x-18},${y+65} M${x},${y+43} L${x+18},${y+65}`);
    text(x,y+86,label,13);
  };
  const entity = (x,y,w,title,fields) => {
    rect(x,y,w,27,'',C.grey);text(x+w/2,y+18,title,13,'middle',true);
    rect(x,y+27,w,fields.length*18+12,'','#fafafa');
    fields.forEach((f,i)=>text(x+9,y+47+i*18,f,13,'start'));
  };
  return {text,rect,oval,line,path,actor,entity,svg:()=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><marker id="arrow" markerWidth="8" markerHeight="7" refX="7" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="none" stroke="#444"/></marker></defs><rect width="100%" height="100%" fill="white"/><g font-family="Arial, sans-serif" fill="#111" stroke-width="1.2">${parts.join('')}</g></svg>`};
}

export function referenceDiagram(name) {
  let d;
  if(name === 'fig-3-1-architecture') {
    d=drawing(760,330);
    d.rect(35,15,690,66,'PRESENTATION LAYER\nNext.js pages: Brief, Assess, Portfolio, Methodology',C.blue,14,5);
    d.line(380,81,380,119,true);d.text(460,105,'HTTPS / JSON',11);
    d.rect(35,120,690,72,'APPLICATION LAYER\nPython APIs: prediction, model comparison, portfolio analytics',C.green,14,5);
    d.line(210,192,210,235,true);d.text(245,218,'Read',11);
    d.rect(35,236,335,72,'DATA LAYER\nModel files and portfolio aggregates',C.yellow,14,5);
    d.rect(390,236,335,72,'OFFLINE TRAINING\nDataset, model fitting and evaluation',C.red,14,5);
    d.path('M555,308 V322 H210 V308',true);d.text(380,318,'Export files',10);
  } else if(name === 'fig-synopsis-model-comparison') {
    d=drawing(800,355);
    d.rect(270,10,260,40,'Twelve applicant fields',C.blue,15);
    d.line(400,50,400,75,true);
    d.rect(245,75,310,42,'Validate and encode once',C.blue,15);
    const models=[['Gradient Boosting','250 trees'],['XGBoost','200 trees'],['Random Forest','300 trees']];
    models.forEach(([name,detail],i)=>{
      const x=20+i*263;
      d.path(`M400,117 V140 H${x+117} V164`,true);
      d.rect(x,165,234,62,`${name}\n${detail}`,C.green,15);
      d.path(`M${x+117},227 V252 H400 V275`,true);
    });
    d.rect(175,276,450,46,'Compare calibrated probabilities and decisions',C.yellow,14);
    d.text(400,346,'Gradient Boosting also drives the visible waterfall and what-if cutoff.',13);
  } else if(name === 'fig-3-2-modules') {
    d=drawing(800,310);
    d.rect(253,15,294,38,'Loan Default Risk Predictor',C.grey,15);
    const columns=[['Training Pipeline','Prepare data','Compare models','Tune and calibrate','Export artifacts'],['Scoring API','Validate input','Score applicant','Calibrate risk','Explain result'],['Web Interface','Brief','Assess applicant','Portfolio analytics','Methodology'],['Testing','Model tests','API tests','UI tests','Parity checks']];
    columns.forEach((labels,i)=>{
      const x=15+i*198;
      d.line(400,53,x+88,85);
      d.rect(x,85,176,43,labels[0],C.blue,14);
      labels.slice(1).forEach((label,j)=>d.rect(x+5,147+j*35,166,26,label,'white',12));
    });
  } else if(name === 'fig-3-3-erd') {
    d=drawing(810,450);
    // Conceptual objects, not database tables: there is no applicant persistence.
    d.entity(15,130,185,'APPLICANT',['age','employment_years','job_type, housing']);
    d.entity(310,15,190,'LOAN APPLICATION',['monthly_income','loan_amount','duration_months','purpose, existing_credits']);
    d.entity(310,310,190,'CREDIT POSITION',['credit_history','checking_status','savings_status']);
    d.entity(600,15,195,'MODEL ARTIFACT',['model_version','trees, categories','platt_a, platt_b','cutoff']);
    d.entity(600,205,195,'PREDICTION',['probability_of_default','risk_band, score','decision']);
    d.entity(600,355,195,'CONTRIBUTION',['feature, value','contribution']);
    d.path('M200,155 H255 V70 H310',true);d.text(255,125,'1 : 1 submits',11);
    d.line(405,126,405,310,true);d.text(413,240,'1 : 1 includes',11,'start');
    d.path('M500,80 H553 V245 H600',true);d.text(545,172,'1 : many',10,'end');d.text(545,187,'receives',10,'end');
    d.line(698,126,698,205,true);d.text(706,177,'1 : many produces',10,'start');
    d.line(698,298,698,355,true);d.text(706,337,'1 : 0..many explains',10,'start');
  } else if(name === 'fig-3-4-dfd0') {
    d=drawing(780,310);
    const rows=[['Loan officer','Applicant details','Score and decision'],['Risk analyst','Cutoff and filters','Portfolio analytics'],['Model maintainer','Updated model files','Model metrics']];
    rows.forEach(([who,input,output],i)=>{
      const y=20+i*105;d.rect(15,y,145,48,who,'white',13);
      const sy=95+i*53;
      const edge = py => 410-90*Math.sqrt(1-((py-155)/75)**2);
      d.line(160,y+12,edge(sy),sy,true);d.text(227,(y+12+sy)/2-13,input,10);
      d.line(edge(sy+20),sy+20,160,y+37,true);d.text(227,(sy+20+y+37)/2+24,output,10);
    });
    d.oval(410,155,90,75,'0\nLoan Default\nRisk Predictor','#f2f2f2',15);
    d.rect(600,126,165,58,'Model and\nportfolio files',C.yellow,13);
    d.line(500,144,600,144,true);d.text(551,133,'Read / update',10);
    d.line(600,169,500,169,true);d.text(551,188,'Artifacts',10);
  } else if(name === 'fig-3-5-dfd1') {
    d=drawing(800,510);
    const labels=['Validate input','Encode features','Score ensemble','Calibrate and band','Explain result','Portfolio analytics'];
    const flows=['Applicant details','Valid input','Feature vector','Raw score','Risk result'];
    d.rect(15,18,125,42,'Loan officer','white',13);
    d.line(140,39,310,39,true);d.text(221,29,flows[0],10);
    labels.forEach((label,i)=>d.oval(400,42+i*78,90,29,`${i+1}.0\n${label}`,'#f2f2f2',12));
    for(let i=0;i<4;i++){
      d.line(400,71+i*78,400,91+i*78,true);d.text(410,85+i*78,flows[i+1],10,'start');
    }
    d.path('M310,354 H180 V60 H140',true);d.text(169,235,'Result and\ndrivers',11,'end');
    d.rect(620,118,165,42,'D1  Model files',C.yellow,12);
    [1,2,3].forEach(i=>{d.path(`M620,139 H567 V${42+i*78} H490`,true);});
    d.text(572,109,'Encoding, trees, calibration',10);
    d.rect(15,411,125,42,'Risk analyst','white',13);
    d.line(140,422,310,422,true);d.text(222,412,'Cutoff / filters',10);
    d.line(310,445,140,445,true);d.text(222,463,'Portfolio summary',10);
    d.rect(620,411,165,42,'D2  Portfolio file',C.yellow,12);
    d.line(620,432,490,432,true);d.text(555,420,'Aggregates',10);
  } else if(name === 'fig-3-6-usecase') {
    d=drawing(780,480);
    d.rect(210,10,360,450,'','white');d.text(390,37,'Loan Default Risk Predictor',14,'middle',true);
    d.actor(85,100,'Loan officer');d.actor(85,325,'Risk analyst');d.actor(690,300,'Model maintainer');
    const uses=['Enter applicant details','Load sample applicant','Score applicant','View score drivers','Adjust decision cutoff','View portfolio analytics','Review methodology','Retrain and export models'];
    // Associations have no arrowheads, as in UML use-case notation.
    [0,1,2,3,4].forEach(i=>d.line(106,132,240,76+i*48));
    [5,6].forEach(i=>d.line(106,357,240,76+i*48));
    [6,7].forEach(i=>d.line(669,332,540,76+i*48));
    uses.forEach((label,i)=>d.oval(390,76+i*48,150,18,label,'#fafafa',12));
  } else if(name === 'fig-3-7-training-flow' || name === 'fig-3-8-predict-flow') {
    d=drawing(400,570);
    const training=name.includes('training');
    const box=(y,label,fill=C.blue)=>d.rect(25,y,230,40,label,fill,14,4);
    const down=(a,b)=>d.line(140,a,140,b,true);
    const diamond=(y,label)=>{
      d.path(`M140,${y-35} L220,${y} L140,${y+35} L60,${y} Z`);
      d.text(140,y+4,label,14);
    };
    d.oval(140,22,42,17,'Start',C.green,14);down(39,60);
    if(training){
      box(60,'Load and prepare data');down(100,120);
      box(120,'Compare four models');down(160,180);
      box(180,'Tune model parameters');down(220,240);
      box(240,'Calibrate and refit models');down(280,305);
      diamond(340,'Export parity\ncheck passes?');
      d.line(220,340,275,340,true);d.text(247,330,'No',12);
      d.rect(276,315,112,50,'Investigate\nmismatch',C.red,13,4);
      d.path('M332,315 V260 H255',true);
      down(375,409);d.text(158,398,'Yes',12);
      box(410,'Export models and\nportfolio file',C.green);down(450,533);
    }else{
      box(60,'Receive applicant details');down(100,125);
      diamond(160,'All input\nchecks pass?');
      d.line(220,160,275,160,true);d.text(247,150,'No',12);
      d.rect(276,135,112,50,'Return\n400 error',C.red,13,4);
      d.path('M332,185 V550 H182',true);
      down(195,230);d.text(158,218,'Yes',12);
      box(230,'Encode applicant features');down(270,290);
      box(290,'Score trained models');down(330,350);
      box(350,'Calibrate probability');down(390,410);
      box(410,'Assign decision and\nexplain risk');down(450,470);
      box(470,'Return assessment',C.green);down(510,533);
    }
    d.oval(140,550,42,17,'End',C.green,14);
  } else if(name === 'fig-3-9-decision-state') {
    d=drawing(800,270);
    d.oval(25,133,7,7,'','#111');d.line(32,133,82,133,true);
    d.oval(175,133,92,31,'Applicant scored',C.yellow,14);
    const states=[['Approve',C.green,65,27,'p < 15%'],['Approve with\nconditions',C.green,65,82,'15% ≤ p < 25%'],['Refer for review',C.yellow,65,185,'25% ≤ p < 40%'],['Decline',C.red,65,240,'p ≥ 40%']];
    states.forEach(([label,color,rx,y,condition])=>{
      d.path(`M267,133 H315 V${y} H602`,true);
      d.text(458,y-9,condition,14);
      d.oval(692,y,90,25,label,color,13);
    });
  } else if(name === 'fig-3-predict-sequence') {
    d=drawing(820,440);
    const lanes=[['User',85],['Web interface',300],['Scoring API',520],['Model files',735]];
    lanes.forEach(([label,x])=>{
      d.rect(x-78,10,156,42,label,'white',15);
      d.line(x,52,x,420,false,true);
    });
    const message=(x1,x2,y,label,reply=false)=>{
      d.line(x1,y,x2,y,true,reply);
      d.text((x1+x2)/2,y-9,label,14);
    };
    message(85,300,90,'Enter applicant details');
    message(300,520,135,'Submit request');
    d.path('M520,176 H555 V197 H520',true);d.text(510,180,'Validate input',14,'end');
    message(520,735,235,'Read trained models');
    message(735,520,278,'Model data',true);
    d.path('M520,315 H555 V336 H520',true);d.text(510,319,'Score, calibrate and explain',14,'end');
    message(520,300,372,'Return risk results',true);
    message(300,85,412,'Display assessment',true);
  } else if(name === 'fig-4-1-deployment') {
    d=drawing(820,225);
    const nodes=[['User\nbrowser','white'],['Next.js\nweb interface',C.blue],['Python\nscoring APIs',C.green],['Model and\nportfolio files',C.yellow]];
    nodes.forEach(([label,color],i)=>{d.rect(15+i*208,72,165,63,label,color,14,4);if(i<3){d.line(180+i*208,103,222+i*208,103,true);d.text(201+i*208,90,['HTTPS','JSON','Read'][i],10);}});
    d.text(433,171,'Vercel deployment',12,'middle',true);
    d.text(433,195,'GitHub / Vercel CLI publishes the site, APIs and exported artifacts.',11);
  } else if(name === 'fig-2-1-gantt') {
    d=drawing(800,300);
    d.rect(15,15,380,34,'Development activity',C.grey,13);
    for(let i=0;i<6;i++)d.rect(395+i*65,15,65,34,`Week ${i+1}`,C.grey,12);
    const tasks=['Orientation and data understanding','Data preparation and feature engineering','Model comparison and tuning','Calibration, explanations and export','API and web interface','Testing, deployment and report'];
    tasks.forEach((s,i)=>{
      d.rect(15,49+i*39,380,39,'');d.text(27,74+i*39,s,12,'start');
      for(let j=0;j<6;j++)d.rect(395+j*65,49+i*39,65,39,'',i===j?C.blue:'white');
      d.rect(405+i*65,59+i*39,45,19,'','#b5c8e6');
    });
  }
  return d?.svg();
}
