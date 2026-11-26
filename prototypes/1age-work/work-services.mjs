// Local synthetic catalog. No job offers, identity requests, personal records, or credentials.
export const categories=['Design','Development','Marketing','Operations','Finance','Customer support','3D architecture','Gaming','Writing','Community'];
export const examples=[
 {title:'Graphic Designer',category:'Design',sector:'Blockchain',type:'Contract',arrangement:'Remote'},
 {title:'3D Environment Artist',category:'3D architecture',sector:'1AGE-related',type:'Freelance',arrangement:'Virtual'},
 {title:'Community Manager',category:'Community',sector:'Blockchain',type:'Full-time',arrangement:'Remote'},
 {title:'Customer Support Specialist',category:'Customer support',sector:'General remote',type:'Part-time',arrangement:'Remote'},
 {title:'Software Developer',category:'Development',sector:'Blockchain',type:'Full-time',arrangement:'Remote'}
];
export function filterExamples(category='All',sector='All'){return examples.filter(x=>(category==='All'||x.category===category)&&(sector==='All'||x.sector===sector));}
export function mountWork(host,group){
 const root=document.createElement('section');host.append(root);
 const make=(tag,text,parent=root)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;};
 const button=(label,fn,parent=root)=>{const b=make('button',label,parent);b.type='button';b.addEventListener('click',fn);return b;};
 const choose=(label,options,parent=root)=>{const l=make('label',label,parent);l.className='work-field';const s=make('select','',l);for(const v of options)s.add(new Option(v,v));return s;};
 const notice=t=>{const p=make('p',t);p.className='work-notice';};
 const link=(label,url)=>{const a=make('a',label);a.href=url;return a;};
 if(group==='jobs'||group==='freelance'){
 notice('Illustrative roles only — no actual vacancies, employers or applications.');
 const category=choose('Professional category',['All',...categories]),sector=choose('Industry',['All','Blockchain','General remote','1AGE-related']),results=make('div','');
 function render(){results.replaceChildren();const rows=filterExamples(category.value,sector.value).filter(x=>group!=='freelance'||['Contract','Freelance'].includes(x.type));for(const job of rows){const card=make('article','',results);card.className='mission-card';make('strong',job.title,card);make('p',[job.sector,job.arrangement,job.type].join(' · '),card);const apply=button('Apply with 1AGE Page (planned)',()=>{},card);apply.disabled=true;}if(!rows.length)make('p','No matching example roles.',results);}
 category.addEventListener('change',render);sector.addEventListener('change',render);render();
 }else if(group==='employer'){
 notice('Local employer posting mockup. No publication or data submission; use fictional details only.');
 const form=make('form','');form.autocomplete='off';
 const field=(label,tag='input')=>{const l=make('label',label,form);l.className='work-field';const x=make(tag,'',l);x.maxLength=tag==='textarea'?600:100;x.required=true;return x;};
 const title=field('Example job title'),company=field('Fictional company'),category=choose('Category',categories,form),type=choose('Employment type',['Full-time','Part-time','Contract','Freelance','Internship'],form),arrangement=choose('Work arrangement',['Remote','Virtual','Hybrid'],form),description=field('Example description','textarea');
 const result=make('p','');result.setAttribute('role','status');
 button('Preview listing locally',()=>{if(!form.reportValidity())return;result.textContent=[title.value,company.value,category.value,type.value,arrangement.value,description.value].join(' · ')+' — example only, not published.';},form);form.addEventListener('submit',e=>e.preventDefault());
 const publish=button('Publish unavailable',()=>{},form);publish.disabled=true;
 notice('Future requirements: verified employer, applicable location and compensation disclosures, moderation, scam reporting and expiration.');
 }else if(group==='records'){
 make('h3','Employment & income records');
 notice('Planned private records service. No actual proof, payroll, verification, certificate or pay stub can be issued here.');
 for(const [title,detail] of [['Employment verification','Employer-confirmed role, employment status and dates.'],['Employee payroll statements','Authorized pay periods, gross and net compensation, deductions, tax and payment details.'],['Contractor income records','Verified invoices, contract and settlement records; not employee pay stubs.'],['Crypto settlement evidence','Transaction confirmation plus employer/payroll reconciliation and local-currency valuation at payment time.'],['Private sharing','Worker-authorized time-limited verification, issuer identity and revocation checks.']]){const card=make('article','');card.className='mission-card';make('strong',title,card);make('p',detail,card);}
 notice('A blockchain transfer alone does not prove employment or income. Housing providers decide what documentation they accept. No wage or housing eligibility decision is made.');
 link('IRS: digital asset tax information','https://www.irs.gov/filing/digital-assets');link('W3C verifiable credentials standard','https://www.w3.org/TR/vc-data-model/');
 }else{
 make('h3','Professional identity');notice('Future opt-in Page portfolio sharing and employer-authorized applications. No personal data is requested or sent.');
 link('Explore 1AGE Page','https://1age.page/');link('Explore 1AGE Quest','https://1age.quest/');
 }
}
