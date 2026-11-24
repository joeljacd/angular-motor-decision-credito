<script type="text/x-dc" data-dc-script="" data-props="{&quot;theme&quot;:{&quot;editor&quot;:&quot;enum&quot;,&quot;options&quot;:[&quot;Claro&quot;,&quot;Oscuro&quot;],&quot;default&quot;:&quot;Claro&quot;,&quot;tsType&quot;:&quot;string&quot;,&quot;section&quot;:&quot;Apariencia&quot;},&quot;alertas&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:true,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Estados simulados&quot;},&quot;servicio503&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:false,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Estados simulados&quot;},&quot;simular409&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:false,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Estados simulados&quot;},&quot;startLoggedIn&quot;:{&quot;editor&quot;:&quot;boolean&quot;,&quot;default&quot;:false,&quot;tsType&quot;:&quot;boolean&quot;,&quot;section&quot;:&quot;Demo&quot;}}">
const THEMES={
 light:{'--color-bg':'#F4F5F7','--color-surface':'#FFFFFF','--color-text':'#2A2A2A','--color-divider':'#E5E7EB','--color-accent':'#A60C19',
  '--color-accent-100':'#FDECEC','--color-accent-200':'#FAD9DB','--color-accent-300':'#F2B6BB','--color-accent-400':'#DB6B74','--color-accent-500':'#C02B37','--color-accent-600':'#900B16','--color-accent-700':'#900B16','--color-accent-800':'#6B000B','--color-accent-900':'#480007',
  '--color-neutral-100':'#F4F5F7','--color-neutral-200':'#F0EDED','--color-neutral-300':'#E5E7EB','--color-neutral-400':'#C9CCD1','--color-neutral-500':'#9CA3AF','--color-neutral-600':'#8B8F96','--color-neutral-700':'#5B403E','--color-neutral-800':'#3F2C2B','--color-neutral-900':'#2A2A2A',
  '--bz-side':'#FFFFFF','--bz-side-border':'#F0EDED','--bz-field':'#6B000B','--bz-field-line':'rgba(255,255,255,.08)','--bz-field-muted':'#F2B6BB','--bz-field-soft':'#DB6B74',
  '--bz-success':'#15803D','--bz-success-bg':'#DCFCE7','--bz-error':'#BA1A1A','--bz-error-bg':'#FDECEC','--bz-warning':'#CCA830','--bz-warning-bg':'#FBF3D5','--bz-warning-fg':'#6B5410','--bz-orange':'#C2410C','--bz-orange-bg':'#FFEDD5','--bz-info':'#1D4ED8','--bz-info-bg':'#E0E9FB',
  '--bz-act-c':'#16A34A','--bz-act-c-fg':'#FFFFFF','--bz-act-e':'#CCA830','--bz-act-e-fg':'#2A2A2A','--bz-act-r':'#BA1A1A','--bz-act-r-fg':'#FFFFFF','--bz-act-g':'#9CA3AF','--bz-act-g-fg':'#FFFFFF','--bz-code-bg':'#F7F7F9'},
 dark:{'--color-bg':'#120E0E','--color-surface':'#1A1414','--color-text':'#F4F5F7','--color-divider':'#3A2A2A','--color-accent':'#E24B4B',
  '--color-accent-100':'#3A1014','--color-accent-200':'#4A161C','--color-accent-300':'#6E242B','--color-accent-400':'#A8343D','--color-accent-500':'#C8424A','--color-accent-600':'#C41422','--color-accent-700':'#F08A8A','--color-accent-800':'#E8C4C4','--color-accent-900':'#F4DADA',
  '--color-neutral-100':'#201818','--color-neutral-200':'#2A1F1F','--color-neutral-300':'#3A2A2A','--color-neutral-400':'#5A4847','--color-neutral-500':'#8A7A78','--color-neutral-600':'#8A7A78','--color-neutral-700':'#C4B4B2','--color-neutral-800':'#DCCFCD','--color-neutral-900':'#000000',
  '--bz-side':'#1A1414','--bz-side-border':'#2A1F1F','--bz-field':'#3A1014','--bz-field-line':'rgba(255,255,255,.06)','--bz-field-muted':'#E8C4C4','--bz-field-soft':'#C4B4B2',
  '--bz-success':'#4ADE80','--bz-success-bg':'rgba(74,222,128,.12)','--bz-error':'#F87171','--bz-error-bg':'rgba(248,113,113,.12)','--bz-warning':'#FBBF24','--bz-warning-bg':'rgba(251,191,36,.12)','--bz-warning-fg':'#FBBF24','--bz-orange':'#FB923C','--bz-orange-bg':'rgba(251,146,60,.14)','--bz-info':'#93B4F8','--bz-info-bg':'rgba(147,180,248,.12)',
  '--bz-act-c':'#4ADE80','--bz-act-c-fg':'#0B1A10','--bz-act-e':'#FBBF24','--bz-act-e-fg':'#1A1200','--bz-act-r':'#F87171','--bz-act-r-fg':'#2A0A0A','--bz-act-g':'#8A7A78','--bz-act-g-fg':'#120E0E','--bz-code-bg':'#140F0F'}};
const MASTERS=[['m-canales','Canales y productos','layers'],['m-acciones','Acciones','flag'],['m-parametros','Parámetros','sliders'],['m-catalogos','Catálogos','list'],['m-roles','Roles','key']];
const MK=MASTERS.map(m=>m[0]);
const ORDER=['inicio','flujos','solicitudes',...MK,'historial','integridad','usuarios','perfiles'];
const ALLOPTS=['cap.solicitar','cap.aprobar',...ORDER];
const PROFILES=[
 {id:1,codigo:'PRF-001',nombre:'Administrador',desc:'Acceso total, incluida la seguridad del portal.',estado:'Activo',upd:'03/11/2026',opts:[...ALLOPTS]},
 {id:2,codigo:'PRF-002',nombre:'Aprobador',desc:'Aprueba borradores y solicitudes; también solicita y edita.',estado:'Activo',upd:'14/11/2026',opts:['cap.solicitar','cap.aprobar','inicio','flujos','solicitudes',...MK,'historial','integridad']},
 {id:3,codigo:'PRF-003',nombre:'Solicitador',desc:'Edita borradores y crea solicitudes de cambio.',estado:'Activo',upd:'14/11/2026',opts:['cap.solicitar','inicio','flujos','solicitudes',...MK,'historial']},
 {id:4,codigo:'PRF-004',nombre:'Solo consulta',desc:'Lectura de inicio, flujos y maestros.',estado:'Activo',upd:'02/10/2026',opts:['inicio','flujos',...MK]},
 {id:5,codigo:'PRF-005',nombre:'Auditor (heredado)',desc:'Lectura de historial e integridad.',estado:'Inactivo',upd:'11/05/2026',opts:['historial','integridad']}];
const DEMO=['mfcevallos','lmora','aperez','cruiz'];
const norm=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const U=(usuario,nombre,perfil,estado,acceso,cargo)=>({id:usuario,usuario,nombre,correo:usuario+'@bancoamazonas.ec',perfil,estado,acceso,cargo:cargo||''});
const USERS=[U('mfcevallos','María Fernanda Cevallos',1,'Activo','22/11/2026 09:14','Jefe de Seguridad de la Información'),U('lmora','Luis Mora',2,'Activo','22/11/2026 08:51','Jefe de Riesgo de Crédito'),U('aperez','Ana Pérez',3,'Activo','22/11/2026 10:42','Analista de Políticas de Crédito'),U('cruiz','Carla Ruiz',4,'Activo','21/11/2026 16:20','Analista de Cumplimiento')]
 .concat(['Juan Carlos Pérez','Andrea Salazar','Luis Miguel Torres','Gabriela Mora','Diego Andrade','Paola Villacís','Fernando Ruiz','Daniela Herrera','Santiago Ortiz','Valeria Paredes','Christian Vega','Carolina Benítez','Marco Jaramillo','Lucía Espinoza','Esteban Cárdenas','Natalia Guerrero','Ricardo Zambrano','Karla Montalvo'].map((n,i)=>{const p=n.split(' ');const u=norm(p[0][0]+p[p.length-1]);const inact=[4,9,15].includes(i);
  return U(u,n,[3,3,4,2,3,4,3,2,4,3,3,4,2,3,4,3,5,3][i],inact?'Inactivo':'Activo',inact?'—':String(21-(i%18)).padStart(2,'0')+'/11/2026 '+String(8+(i%9)).padStart(2,'0')+':'+String((i*7)%60).padStart(2,'0'));}));
let _n=0;const nid=()=>'n'+(++_n);
const C=(v,k,o)=>({id:nid(),t:'c',v,k,...o});const G=(op,ch)=>({id:nid(),t:'g',op,ch});
const RS=(a,b,c,m)=>({cumple:{a:a,cod:'000',msg:m[0]},nocumple:{a:b,cod:m[1],msg:m[2]},falta:{a:c,cod:m[3],msg:m[4]}});
const P=(code,nombre,orden,root,res,activa=true)=>({code,nombre,orden,activa,root,res});
const V1={detener:true,desde:'15/10/2026',hasta:'',cats:[
 {code:'1',nombre:'Información Cliente',orden:1,activa:true,det:'heredada',pols:[
  P('PA-001A','Condición ciudadano — fallecido',1,G('Y',[C('CONDICION_CIUDADANO','FIJO',{op:'<>',val:'FALLECIDO'})]),RS('C','R','E',['Ciudadano habilitado','101','Ciudadano registrado como fallecido','901','Sin dato de condición ciudadana'])),
  P('PA-002','Nacionalidad',2,G('Y',[C('NACIONALIDAD','FIJO',{op:'=',val:'ECUATORIANA'})]),RS('C','E','E',['Nacionalidad aceptada','102','Nacionalidad requiere evaluación','902','Sin dato de nacionalidad'])),
  P('PA-003','Nivel de estudios',3,G('Y',[C('NIVEL_ESTUDIOS','CATALOGO',{cat:'NIVELES_ESTUDIO_ACEPTADOS',modo:'pertenece'})]),RS('C','E','E',['Nivel de estudios aceptado','103','Nivel de estudios fuera de política','903','Sin dato de estudios']))]},
 {code:'2',nombre:'Información Geográfica',orden:2,activa:true,det:'si',pols:[
  P('PA-004','Zona geográfica',1,G('Y',[C('CANTON','CATALOGO',{cat:'CANTONES_ACEPTADOS',modo:'pertenece'})]),RS('C','R','E',['Zona aceptada','104','Cantón fuera de cobertura','904','Sin dato de cantón']))]},
 {code:'3',nombre:'Información Financiera',orden:3,activa:true,det:'heredada',pols:[
  P('PA-005','UAFE',1,G('Y',[C('REGISTRO_UAFE','FIJO',{op:'=',val:'N'})]),RS('C','R','E',['Sin registro UAFE','105','Cliente con registro UAFE','905','Sin dato UAFE'])),
  P('PA-006','Ingreso dependiente',2,G('O',[C('TIPO_CLIENTE','FIJO',{op:'=',val:'INDEPENDIENTE'}),C('INGRESO_FAMILIAR','RANGO',{desde:'800.00',hasta:''})]),RS('C','E','E',['Ingreso suficiente','106','Ingreso bajo el mínimo','906','Sin dato de ingreso'])),
  P('PA-007','Edad y estabilidad',3,G('Y',[C('EDAD','RANGO',{desde:'21',hasta:'70'}),G('O',[C('ANTIGUEDAD_LABORAL','RANGO',{desde:'1',hasta:''}),C('TIPO_CLIENTE','FIJO',{op:'=',val:'INDEPENDIENTE'})])]),RS('C','E','E',['Perfil estable','107','Edad o estabilidad fuera de política','907','Sin dato de edad']))]},
 {code:'4',nombre:'Información Laboral',orden:4,activa:false,det:'no',pols:[
  P('PA-008','Actividad económica',1,G('Y',[C('ACTIVIDAD_ECONOMICA','CATALOGO',{cat:'ACTIVIDADES_ECONOMICAS',modo:'pertenece'})]),RS('C','E','E',['Actividad aceptada','108','Actividad no financiable','908','Sin dato de actividad']))]}]};
const mkDraft=()=>{const d=JSON.parse(JSON.stringify(V1));const c3=d.cats[2];c3.pols[1].root.ch[1].desde='850.00';c3.pols[2].root.ch[1].ch[0].v='SCORE_BURO_V2';c3.pols[2].root.ch[1].ch[0].desde='650';d.cats[3].pols[0].root.ch=[];return d;};
const VARS=[
 {code:'CONDICION_CIUDADANO',nombre:'Condición del ciudadano',tipo:'TEXT',sens:false,origen:'request',ruta:'customer.citizenStatus'},
 {code:'NACIONALIDAD',nombre:'Nacionalidad',tipo:'TEXT',sens:false,origen:'request',ruta:'customer.nationality'},
 {code:'NIVEL_ESTUDIOS',nombre:'Nivel de estudios',tipo:'TEXT',sens:false,origen:'request',ruta:'customer.educationLevel'},
 {code:'CANTON',nombre:'Cantón de residencia',tipo:'TEXT',sens:false,origen:'request',ruta:'address.canton'},
 {code:'REGISTRO_UAFE',nombre:'Registro UAFE',tipo:'TEXT',sens:true,origen:'request',ruta:'compliance.uafeFlag'},
 {code:'TIPO_CLIENTE',nombre:'Tipo de cliente',tipo:'TEXT',sens:false,origen:'request',ruta:'customer.type'},
 {code:'INGRESO_FAMILIAR',nombre:'Ingreso familiar mensual',tipo:'MONEY',sens:true,origen:'request',ruta:'financial.familyIncome'},
 {code:'EDAD',nombre:'Edad del solicitante',tipo:'NUMBER',sens:false,origen:'calc',fn:'Edad',campo:'customer.birthDate'},
 {code:'ANTIGUEDAD_LABORAL',nombre:'Antigüedad laboral (años)',tipo:'NUMBER',sens:false,origen:'calc',fn:'Años transcurridos',campo:'employment.startDate'},
 {code:'ACTIVIDAD_ECONOMICA',nombre:'Actividad económica',tipo:'TEXT',sens:false,origen:'request',ruta:'employment.activityCode'},
 {code:'FECHA_NACIMIENTO',nombre:'Fecha de nacimiento',tipo:'DATE',sens:true,origen:'request',ruta:'customer.birthDate'},
 {code:'MONTO_SOLICITADO',nombre:'Monto solicitado',tipo:'MONEY',sens:false,origen:'request',ruta:'credit.amount'}];
const CATALOGS=[
 {code:'NIVELES_ESTUDIO_ACEPTADOS',nombre:'Niveles de estudio aceptados',items:[['SEC','Secundaria',true],['TEC','Técnico / Tecnológico',true],['UNI','Universitario',true],['POS','Posgrado',true],['PRI','Primaria',false]]},
 {code:'CANTONES_ACEPTADOS',nombre:'Cantones aceptados',items:[['0901','Guayaquil',true],['1701','Quito',true],['0101','Cuenca',true],['1301','Portoviejo',true],['0701','Machala',true],['1801','Ambato',true],['0907','Durán',true],['1308','Manta',true]]},
 {code:'ACTIVIDADES_ECONOMICAS',nombre:'Actividades económicas financiables',items:[['G4711','Comercio al por menor',true],['C1071','Elaboración de panadería',true],['H4921','Transporte urbano de pasajeros',true],['A0111','Cultivo de cereales',false]]},
 {code:'PROVINCIAS_RIESGO',nombre:'Provincias con riesgo elevado',items:[]}];
const F=(cat,ruta,tipo,req,formato,max,catalogo,sens,desc,ej)=>({cat,ruta,tipo,req,formato,max,catalogo,sens,desc,ej});
const FIELDS=[
 F('Común','customer.idNumber','TEXT',true,'',13,'',false,'Cédula o RUC del solicitante','0912345678'),
 F('Común','customer.birthDate','DATE',true,'MM/dd/yyyy','','',true,'Fecha de nacimiento','04/18/1988'),
 F('Cliente','customer.citizenStatus','TEXT',true,'',20,'',false,'Condición en Registro Civil','VIVO'),
 F('Cliente','customer.nationality','TEXT',true,'',30,'',false,'Nacionalidad','ECUATORIANA'),
 F('Cliente','customer.educationLevel','TEXT',false,'',3,'NIVELES_ESTUDIO_ACEPTADOS',false,'Nivel de estudios','UNI'),
 F('Cliente','customer.type','TEXT',true,'',20,'',false,'Dependiente o independiente','DEPENDIENTE'),
 F('Geográfica','address.canton','TEXT',true,'',4,'CANTONES_ACEPTADOS',false,'Código de cantón INEC','0901'),
 F('Financiera','financial.familyIncome','MONEY',true,'0.00','','',true,'Ingreso familiar mensual','1250.00'),
 F('Financiera','compliance.uafeFlag','TEXT',true,'',1,'',true,'Marca en listas UAFE (S/N)','N'),
 F('Financiera','credit.amount','MONEY',true,'0.00','','',false,'Monto solicitado','15000.00'),
 F('Laboral','employment.activityCode','TEXT',false,'',5,'ACTIVIDADES_ECONOMICAS',false,'Código CIIU de la actividad','G4711')];
const REQS=[
 {id:'SC-0143',tipo:'Sellado',elemento:'Versión 1 · 2 Agencias / 1 Auto Plan',accion:'Sellar',solicitante:'lmora',fecha:'21/11/2026',vence:'06/12/2026',estado:'Pendiente',actual:{Sello:'Sin sellar'},propuesto:{Sello:'Sellada'},comentario:'Versión publicada sin sello tras la migración del 18/11.'},
 {id:'SC-0141',tipo:'Parámetro',elemento:'DIAS_VENCIMIENTO',accion:'Cambio',solicitante:'lmora',fecha:'21/11/2026',vence:'06/12/2026',estado:'Pendiente',actual:{'Código':'DIAS_VENCIMIENTO','Ámbito':'Global',Valor:'15'},propuesto:{'Código':'DIAS_VENCIMIENTO','Ámbito':'Global',Valor:'20'},comentario:'Alinear con el calendario del comité de crédito 2027.'},
 {id:'SC-0140',tipo:'Canal',elemento:'1 Solicitudes Web',accion:'Cambio',solicitante:'lmora',fecha:'12/11/2026',vence:'27/11/2026',estado:'Pendiente',actual:{'Código':'1',Nombre:'Solicitudes Web',Habilitado:'Sí'},propuesto:{'Código':'1',Nombre:'Solicitudes Web y App',Habilitado:'Sí'},comentario:'Unificar canal web y app móvil.'},
 {id:'SC-0139',tipo:'Acción',elemento:'E · ECA',accion:'Cambio',solicitante:'lmora',fecha:'09/11/2026',vence:'24/11/2026',estado:'Pendiente',actual:{'Código':'E',Nombre:'ECA',Severidad:'20',Color:'AMARILLO',Detiene:'No'},propuesto:{'Código':'E',Nombre:'EVALUACIÓN COMITÉ',Severidad:'20',Color:'AMARILLO',Detiene:'No'},comentario:'Nombre más claro para el área comercial.'},
 {id:'SC-0137',tipo:'Canal–producto',elemento:'2 Agencias / 3 Microcrédito',accion:'Habilitar',solicitante:'lmora',fecha:'08/11/2026',vence:'23/11/2026',estado:'Pendiente',stale:true,actual:{Canal:'2 Agencias',Producto:'3 Microcrédito',Habilitado:'No'},propuesto:{Canal:'2 Agencias',Producto:'3 Microcrédito',Habilitado:'Sí'},comentario:'Piloto de microcrédito en agencias.'},
 {id:'SC-0136',tipo:'Rol',elemento:'GG-CRED-CONSULTA',accion:'Alta',solicitante:'aperez',fecha:'16/11/2026',vence:'01/12/2026',estado:'Pendiente',actual:{},propuesto:{'Id de rol':'GG-CRED-CONSULTA',Nombre:'Consulta de crédito',Solicitar:'No',Aprobar:'No',Auditar:'Sí',Activo:'Sí'},comentario:'Acceso de lectura para el área de cumplimiento.'},
 {id:'SC-0133',tipo:'Producto',elemento:'4 Tarjeta Joven',accion:'Alta',solicitante:'aperez',fecha:'02/11/2026',vence:'17/11/2026',estado:'Aprobada',aprobador:'Luis Mora',actual:{},propuesto:{'Código':'4',Nombre:'Tarjeta Joven',Habilitado:'Sí'},comentario:''},
 {id:'SC-0130',tipo:'Catálogo',elemento:'CANTONES_ACEPTADOS',accion:'Cambio',solicitante:'aperez',fecha:'28/10/2026',vence:'12/11/2026',estado:'Rechazada',aprobador:'Luis Mora',rechazo:'Falta sustento del área comercial para incluir Galápagos.',actual:{Fuente:'Manual'},propuesto:{Fuente:'Servicio'},comentario:''},
 {id:'SC-0128',tipo:'Canal',elemento:'3 Banca Móvil',accion:'Deshabilitar',solicitante:'aperez',fecha:'20/10/2026',vence:'04/11/2026',estado:'Cancelada',actual:{Habilitado:'Sí'},propuesto:{Habilitado:'No'},comentario:''},
 {id:'SC-0121',tipo:'Parámetro',elemento:'FORMATO_FECHA',accion:'Cambio',solicitante:'aperez',fecha:'01/10/2026',vence:'16/10/2026',estado:'Vencida',actual:{Valor:'MM/dd/yyyy'},propuesto:{Valor:'dd/MM/yyyy'},comentario:''}];
const BASE_RES={vars:VARS,fields:FIELDS,catalogs:CATALOGS};
const ALERTS=['La versión 3 de Agencias / Consumo tiene firma inválida: el motor no evalúa este canal + producto.','Sello global inválido: el motor no evalúa ningún canal.'];
const BOOT=['Validando sesión con Active Directory…','Consultando capacidades (/me)…','Verificando sellos de integridad…'];
const EN={'Inicio':'Home','Flujos':'Flows','Solicitudes de cambio':'Change requests','Maestros':'Master data','Historial':'History','Integridad':'Integrity','Configuración':'Configuration','Auditoría':'Audit','Canales':'Channels','Productos':'Products','Canal–producto':'Channel–product','Acciones':'Actions','Parámetros':'Parameters','Catálogos':'Catalogs','Roles':'Roles','Motor':'Engine','Seguridad':'Security','Usuarios':'Users','Perfiles':'Profiles'};
const KEY='bamz_portal_v2';
const AUDIT_OK=['historial','integridad'];

class Component extends DCLogic {
  state={w:typeof window!=='undefined'?window.innerWidth:1440,theme:null,lang:'es',loggedIn:false,loginUser:'',loginPass:'',loginErr:'',loginLoading:false,booting:false,bootI:0,
    userId:'mfcevallos',screen:'inicio',params:{},collapsed:false,mobileOpen:false,avatarOpen:false,mOpen:true,hdrOpen:false,users:USERS,profiles:PROFILES,loading:false,modal:null,toastMsg:'',
    flow:{status:'edicion',devolucion:'Revisar el umbral de ingreso de PA-006: el comité aprobó 850.00 solo para dependientes. — María Fernanda Cevallos, 21/11/2026',openedBy:'Ana Pérez',openedId:'aperez',openedAt:'20/11/2026',editors:['aperez','lmora'],editorNames:'Ana Pérez, Luis Mora',last:'22/11/2026 10:42',vence:'05/12/2026',sentAt:''},
    draft:mkDraft(),vars:VARS,fields:FIELDS,catalogs:CATALOGS,reqs:REQS};
  componentDidMount(){
    let s={};try{s=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
    const init={collapsed:!!s.collapsed};if(s.theme)init.theme=s.theme;if(s.lang)init.lang=s.lang;
    if(s.loggedIn||this.props.startLoggedIn){init.loggedIn=true;init.userId=s.userId||'mfcevallos';init.screen=['m-productos','m-canalproducto'].includes(s.screen)?'m-canales':(s.screen||'inicio');{const o=this.meInfo({...this.state,userId:init.userId}).opts;if(!this.allowed(o,init.screen)){init.screen=this.firstAllowed(o);init.params={};}}init.params=s.params||{};}
    this.setState(init);this.applyTheme();
    this._r=()=>this.setState({w:window.innerWidth});window.addEventListener('resize',this._r);
    this._k=e=>{if(e.key==='Escape')this.setState({modal:null,avatarOpen:false,mobileOpen:false});};window.addEventListener('keydown',this._k);
  }
  componentWillUnmount(){window.removeEventListener('resize',this._r);window.removeEventListener('keydown',this._k);clearTimeout(this._t);clearTimeout(this._l);clearInterval(this._b);}
  componentDidUpdate(){this.applyTheme();const s=this.state;try{localStorage.setItem(KEY,JSON.stringify({loggedIn:s.loggedIn,userId:s.userId,screen:s.screen,params:s.params,collapsed:s.collapsed,theme:s.theme,lang:s.lang}))}catch(e){}}
  themeKey(){return this.state.theme||((this.props.theme??'Claro')==='Oscuro'?'dark':'light');}
  applyTheme(){const t=this.themeKey();if(this._applied===t)return;this._applied=t;const el=document.documentElement;Object.entries(THEMES[t]).forEach(([k,v])=>el.style.setProperty(k,v));el.style.colorScheme=t;}
  toast=(m)=>{clearTimeout(this._t);this.setState({toastMsg:m});this._t=setTimeout(()=>this.setState({toastMsg:''}),3000);};
  meInfo(s){const u=s.users.find(x=>x.usuario===s.userId)||s.users[0];const p=s.profiles.find(x=>x.id===u.perfil)||{opts:[],nombre:'Sin perfil',estado:'Inactivo'};
    const on=u.estado==='Activo'&&p.estado==='Activo';const opts=on?p.opts:[];
    const caps={puedeSolicitar:opts.includes('cap.solicitar'),puedeAprobar:opts.includes('cap.aprobar'),puedeAuditar:opts.includes('historial')||opts.includes('integridad')};
    const roles=[caps.puedeSolicitar&&'Solicitar',caps.puedeAprobar&&'Aprobar',caps.puedeAuditar&&'Auditar'].filter(Boolean);const nm=u.nombre.split(' ');
    return {id:u.usuario,nombre:u.nombre,ini:(nm[0][0]+nm[nm.length-1][0]).toUpperCase(),cargo:u.cargo||'—',perfil:p.nombre,perfilActivo:on,userActive:u.estado==='Activo',opts,...caps,roles,rolesLabel:roles.length?roles.join(' · '):'Solo lectura'};}
  allowed(opts,screen){const k=(screen==='editor'||screen==='revision')?'flujos':screen;return opts.includes(k);}
  firstAllowed(opts){return ORDER.find(k=>opts.includes(k))||'inicio';}
  setUsers=(v)=>this.setState(s=>({users:typeof v==='function'?v(s.users):v}));
  setProfiles=(v)=>this.setState(s=>({profiles:typeof v==='function'?v(s.profiles):v}));
  go=(screen,params)=>{const me=this.meInfo(this.state);if(!this.allowed(me.opts,screen))return this.setState({modal:'403',hdrOpen:false});
    clearTimeout(this._l);this.setState({screen,params:params||{},loading:true,mobileOpen:false,avatarOpen:false,hdrOpen:false});this._l=setTimeout(()=>this.setState({loading:false}),650);if(typeof window!=='undefined')window.scrollTo(0,0);};
  setFlow=(o)=>this.setState(s=>({flow:{...s.flow,...o}}));
  setDraft=(d)=>this.setState(s=>({draft:typeof d==='function'?d(s.draft):d}));
  setVars=(v)=>this.setState(s=>({vars:typeof v==='function'?v(s.vars):v}));
  setCatalogs=(v)=>this.setState(s=>({catalogs:typeof v==='function'?v(s.catalogs):v}));
  setFields=(v)=>this.setState(s=>({fields:typeof v==='function'?v(s.fields):v}));
  setReqs=(v)=>this.setState(s=>({reqs:typeof v==='function'?v(s.reqs):v}));
  conflict=()=>this.setState({modal:'409'});
  forbidden=()=>this.setState({modal:'403'});
  renderVals(){
    const s=this.state,set=o=>this.setState(o);
    const narrow=s.w<900,expanded=narrow||!s.collapsed,isDark=this.themeKey()==='dark';
    const me=this.meInfo(s);const A=k=>me.opts.includes(k);
    const t=l=>s.lang==='en'?(EN[l]||l):l;
    const myEdit=s.flow.editors.includes(me.id)||s.flow.openedId===me.id;
    const pendingCount=s.reqs.filter(r=>r.estado==='Pendiente'&&r.solicitante!==me.id).length+(s.flow.status==='revision'&&!myEdit?1:0);
    const myOpen=s.reqs.filter(r=>r.estado==='Pendiente').length;
    const scr=s.screen;const isM=scr.startsWith('m-');
    const item=(key,label,icon,extra={})=>{const a=extra.active??(scr===key);return {isItem:true,key,label:t(label),i:{[icon]:true},active:a,h:40,fs:14,pad:'12px',
      bg:a?'var(--color-accent-100)':'transparent',color:a?'var(--color-accent-700)':'var(--color-neutral-700)',border:a?'var(--color-accent-300)':'transparent',
      badgePos:expanded?'static':'absolute',go:()=>this.go(key),...extra};};
    const grp=(label,extra={})=>expanded?{isLabel:true,label:t(label),cursor:'default',...extra}:{isDiv:true};
    const navItems=[];
    if(A('inicio'))navItems.push(item('inicio','Inicio','home',{badge:me.puedeAprobar&&pendingCount?pendingCount:0,badgeBg:'var(--color-accent)'}));
    const motor=[['flujos','Flujos','flow',{active:['flujos','editor','revision'].includes(scr)}],['solicitudes','Solicitudes de cambio','req',{badge:myOpen,badgeBg:'var(--color-neutral-600)'}]].filter(x=>A(x[0]));
    if(motor.length){navItems.push(grp('Motor'));motor.forEach(([k,l,i,x])=>navItems.push(item(k,l,i,x)));}
    const ms=MASTERS.filter(([k])=>A(k));
    if(ms.length){navItems.push(grp('Maestros'));ms.forEach(([k,l,ic])=>navItems.push(item(k,l,ic)));}
    const aud=[['historial','Historial','hist',{}],['integridad','Integridad','shield',{badge:(this.props.alertas??true)?'!':0,badgeBg:'var(--bz-error)'}]].filter(x=>A(x[0]));
    if(aud.length){navItems.push(grp('Auditoría'));aud.forEach(([k,l,i,x])=>navItems.push(item(k,l,i,x)));}
    const seg=[['usuarios','Usuarios','users'],['perfiles','Perfiles','idcard']].filter(x=>A(x[0]));
    if(seg.length){navItems.push(grp('Seguridad'));seg.forEach(([k,l,i])=>navItems.push(item(k,l,i)));}
    const alerts=(this.props.alertas??true)&&(A('integridad')||A('inicio'))?ALERTS:[];
    const forbidden=!this.allowed(me.opts,scr);
    const screenKey=isM?'maestros':scr;
    return {
      showLogin:!s.loggedIn,loggedIn:s.loggedIn,wide:!narrow,narrow,isDark,isLight:!isDark,
      themeLabel:isDark?'Tema claro':'Tema oscuro',themeTitle:isDark?'Cambiar a tema claro':'Cambiar a tema oscuro',toggleTheme:()=>set({theme:isDark?'light':'dark'}),
      flowSteps:[{n:'01',t:'Borrador',d:'Se edita una versión nueva'},{n:'02',t:'Revisión',d:'Otra persona revisa diferencias'},{n:'03',t:'Aprobación',d:'Nadie aprueba lo que editó'},{n:'04',t:'Publicación',d:'Firmada y sellada'}],
      loginUser:s.loginUser,loginPass:s.loginPass,loginErr:s.loginErr,loginLoading:s.loginLoading,loginLabel:s.loginLoading?'Validando credenciales…':'Ingresar',
      onLoginUser:e=>set({loginUser:e.target.value,loginErr:''}),onLoginPass:e=>set({loginPass:e.target.value,loginErr:''}),
      onLogin:e=>{e.preventDefault();const id=s.loginUser.trim().toLowerCase();if(!id||!s.loginPass)return set({loginErr:'Ingresa tu usuario de red y contraseña.'});
        const uid=s.users.some(x=>x.usuario===id)?id:'mfcevallos';const uu=s.users.find(x=>x.usuario===uid);set({loginLoading:true});
        setTimeout(()=>{this.setState({loginLoading:false,loggedIn:true,loginPass:'',userId:uid,screen:this.firstAllowed(this.meInfo({...this.state,userId:uid}).opts),params:{},booting:true,bootI:0});
          clearInterval(this._b);this._b=setInterval(()=>this.setState(st=>({bootI:st.bootI+1})),550);
          setTimeout(()=>{clearInterval(this._b);this.setState({booting:false});this.toast('Bienvenido(a), '+uu.nombre);},1700);},900);},
      booting:s.booting,bootStep:BOOT[Math.min(s.bootI,BOOT.length-1)],
      me,canApprove:me.puedeAprobar,pendingCount,goPending:()=>this.go('inicio',{tab:'aprobar'}),
      langEs:s.lang==='es',langEn:s.lang==='en',setEs:()=>set({lang:'es'}),setEn:()=>{set({lang:'en'});this.toast('Idioma: English (menú). El contenido de ejemplo permanece en español.');},
      loading:s.loading,skel:[{a:'30%',b:'12%'},{a:'42%',b:'10%'},{a:'26%',b:'14%'},{a:'38%',b:'9%'},{a:'33%',b:'12%'},{a:'45%',b:'11%'}],
      siderW:narrow?268:(s.collapsed?68:248),siderPos:narrow?'fixed':'sticky',siderX:narrow&&!s.mobileOpen?'translateX(-105%)':'none',
      drawerBackdrop:narrow&&s.mobileOpen,closeDrawer:()=>set({mobileOpen:false}),openDrawer:()=>set({mobileOpen:true}),
      expanded,navJustify:expanded?'flex-start':'center',chevRot:(!narrow&&s.collapsed)?'rotate(180deg)':'none',collapseTitle:narrow?'Cerrar menú':(s.collapsed?'Expandir menú':'Colapsar menú'),
      toggleCollapse:()=>narrow?set({mobileOpen:false}):set({collapsed:!s.collapsed,avatarOpen:false}),navItems,
      avatarOpen:s.avatarOpen,toggleAvatar:()=>set({avatarOpen:!s.avatarOpen}),closeAvatar:()=>set({avatarOpen:false}),
      popLeft:expanded?'10px':'calc(100% + 8px)',popBottom:expanded?'calc(100% + 8px)':'10px',
      openMe:()=>set({modal:'me',avatarOpen:false}),
      hdrOpen:s.hdrOpen,toggleHdr:()=>set({hdrOpen:!s.hdrOpen,avatarOpen:false}),closeHdr:()=>set({hdrOpen:false}),hdrBg:s.hdrOpen?'var(--color-accent-100)':'transparent',hdrBd:s.hdrOpen?'var(--color-accent-300)':'var(--color-divider)',
      canProfiles:A('perfiles'),goProfiles:()=>this.go('perfiles'),
      demoUsers:DEMO.map(id=>{const x=this.meInfo({...s,userId:id});const cur=id===s.userId;const nScr=x.opts.filter(o=>!o.startsWith('cap.')).length;
        return {ini:x.ini,nombre:x.nombre,perfil:x.perfil,current:cur,bg:cur?'var(--color-accent-100)':'transparent',avBg:cur?'var(--color-accent)':'transparent',avFg:cur?'#fff':'var(--color-text)',avBd:cur?'var(--color-accent)':'var(--color-divider)',
          pBg:x.perfilActivo?'var(--color-accent-100)':'var(--color-neutral-200)',pFg:x.perfilActivo?'var(--color-accent-800)':'var(--color-neutral-700)',
          caps:x.perfilActivo?(x.roles.length?x.roles:['Solo lectura']):['Sin acceso'],screens:nScr+(nScr===1?' pantalla':' pantallas'),
          pick:()=>{if(cur)return set({hdrOpen:false});const scr2=this.allowed(x.opts,s.screen)?s.screen:this.firstAllowed(x.opts);clearTimeout(this._l);
            this.setState({userId:id,hdrOpen:false,avatarOpen:false,screen:scr2,params:scr2===s.screen?s.params:{},loading:true});this._l=setTimeout(()=>this.setState({loading:false}),650);this.toast('Viendo como '+x.nombre+' · '+x.perfil);}};}),
      logout:()=>set({loggedIn:false,avatarOpen:false,modal:null,loginPass:''}),
      meRows:[{k:'Usuario AD',v:'BAMAZONAS\\'+me.id},{k:'Perfil',v:me.perfil},{k:'Capacidades (/me)',v:me.rolesLabel},{k:'Correo',v:me.id+'@bancoamazonas.ec'},{k:'Cargo',v:me.cargo},{k:'Ambiente',v:'Producción'},{k:'Sesión iniciada',v:'22/11/2026 09:14'}],
      alerts,showAlerts:alerts.length>0,goIntegrity:()=>this.go('integridad'),lock:!!this.props.servicio503,sim409:!!this.props.simular409,
      sc:{[screenKey]:!s.loading&&!forbidden},forbiddenView:!s.loading&&forbidden,hasHome:me.opts.length>0,goHome:()=>this.go(this.firstAllowed(me.opts)),inactiveNote:!me.userActive?' (tu usuario está inactivo)':(!me.perfilActivo?' (tu perfil está inactivo)':''),
      users:s.users,setUsers:this.setUsers,profiles:s.profiles,setProfiles:this.setProfiles,masterSection:isM?scr.slice(2):'canales',
      baseRes:BASE_RES,flow:s.flow,setFlow:this.setFlow,draft:s.draft,setDraft:this.setDraft,baseline:V1,vars:s.vars,setVars:this.setVars,fields:s.fields,setFields:this.setFields,catalogs:s.catalogs,setCatalogs:this.setCatalogs,
      reqs:s.reqs,setReqs:this.setReqs,params:s.params,go:this.go,toast:this.toast,conflict:this.conflict,forbidden:this.forbidden,
      hasModal:!!s.modal,m409:s.modal==='409',m403:s.modal==='403',mMe:s.modal==='me',closeModal:()=>set({modal:null}),
      reload:()=>{set({modal:null});this.go(s.screen,s.params);this.toast('Se recargó la versión actual');},
      toastMsg:s.toastMsg};
  }
}
</script>


</body></html>