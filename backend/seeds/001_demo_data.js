/**
 * 統包先生 Demo 種子資料
 * 建立完整的測試情境：2 間門市 · 3 個案件 · 打卡 · 日誌 · 請款 · 發票
 */
exports.seed = async function(knex) {

  // ── 客戶 ──
  const [c1] = await knex('customers').insert({
    name:'張先生', gender:'先生', phone:'0912-345-678', line_id:'zhang_sy',
    address:'台北市大安區信義路XX號12F', district:'大安區', city:'台北市',
    source:'官網填單', membership:'gold', total_spending:1328000, points_balance:13280, points_earned:13280,
  }).returning('id');

  const [c2] = await knex('customers').insert({
    name:'李先生', gender:'先生', phone:'0923-456-789', line_id:'lee_bq88',
    address:'台北市信義區松仁路XX號5F', district:'信義區', city:'台北市',
    source:'LINE諮詢', membership:'standard',
  }).returning('id');

  const [c3] = await knex('customers').insert({
    name:'陳太太', gender:'女士', phone:'0934-567-890',
    address:'新北市板橋區文化路XX號8F', district:'板橋區', city:'新北市',
    source:'轉介紹',
  }).returning('id');

  const custId1 = c1.id||c1, custId2 = c2.id||c2, custId3 = c3.id||c3;

  // ── 查門市+人員 ID ──
  const store1 = await knex('stores').where('code','TP01').first();
  const store2 = await knex('stores').where('code','TY01').first();
  const boss = await knex('users').where('username','boss').first();
  const designer = await knex('users').where('username','staff').first();
  const worker = await knex('users').where('username','worker').first();
  const manager = await knex('users').where('username','manager').first();
  const finance = await knex('users').where('username','finance').first();

  // ── 填單 ──
  const [l1] = await knex('leads').insert({
    lead_no:'L-2026-108', customer_id:custId1, name:'陳先生', phone:'0945-678-901',
    city:'台北市', district:'信義區', address:'信義區基隆路XX號',
    house_type:'全新屋裝潢', house_age:'1年以下', area:'31~40坪', budget:'150~300萬',
    contact_time:'上午10~12點', source:'官網填單', status:'未處理', urgency:'hot',
    store_id:store1.id,
  }).returning('id');

  const [l2] = await knex('leads').insert({
    lead_no:'L-2026-107', customer_id:custId3, name:'林小姐', phone:'0956-789-012',
    city:'新北市', district:'板橋區', house_type:'中古屋翻新', house_age:'21~30年',
    area:'21~30坪', budget:'80~150萬', source:'LINE諮詢', status:'已聯繫', urgency:'warm',
    assigned_to:designer.id, assigned_at:new Date(), store_id:store1.id,
  }).returning('id');

  await knex('leads').insert({
    lead_no:'L-2026-106', name:'吳先生', phone:'0967-890-123',
    city:'台北市', district:'大安區', house_type:'中古屋翻新', area:'41~50坪',
    budget:'300萬以上', source:'轉介紹', status:'未處理', urgency:'hot', store_id:store1.id,
  });

  // ── 案件 ──
  const [case1] = await knex('cases').insert({
    case_no:'TM-2026-047', customer_id:custId1, lead_id:null, store_id:store1.id,
    designer_id:designer.id, worker_id:worker.id, manager_id:manager.id,
    name:'大安區 張宅全室翻修', address:'台北市大安區信義路XX號12F',
    area:35, house_type:'中古屋翻新', style:'日式風',
    quote_amount:1400000, contract_amount:1328000, addon_amount:-6500,
    final_amount:1321500, collected:796800, pending:524700, cost:650000, gross_margin:51.1,
    quote_date:'2026-02-01', sign_date:'2026-02-14', start_date:'2026-03-01', est_end_date:'2026-04-15',
    stage:'施工中', status:'active', health:'green', progress:68,
  }).returning('id');

  const [case2] = await knex('cases').insert({
    case_no:'TM-2026-043', customer_id:custId2, store_id:store1.id,
    designer_id:designer.id, worker_id:worker.id, manager_id:manager.id,
    name:'信義區 李宅翻新', address:'台北市信義區松仁路XX號5F',
    area:28, house_type:'中古屋翻新', style:'現代風',
    contract_amount:1820000, collected:1092000, pending:728000, cost:850000, gross_margin:53.3,
    sign_date:'2025-11-20', start_date:'2025-12-01', est_end_date:'2026-02-28',
    stage:'驗收請款', status:'active', health:'yellow', progress:90,
  }).returning('id');

  const [case3] = await knex('cases').insert({
    case_no:'TM-2026-025', customer_id:custId3, store_id:store2?.id||store1.id,
    designer_id:designer.id, manager_id:manager.id,
    name:'板橋 陳宅局部裝修', address:'新北市板橋區文化路XX號8F',
    area:15, house_type:'局部裝修',
    quote_amount:520000, stage:'提案報價', status:'active', health:'green', progress:20,
  }).returning('id');

  const caseId1 = case1.id||case1, caseId2 = case2.id||case2, caseId3 = case3.id||case3;

  // ── 付款節點 ──
  await knex('payment_nodes').insert([
    {case_id:caseId1, period:1, name:'簽約款 30%', percentage:30, amount:398400, due_date:'2026-02-14', received:true, received_date:'2026-02-14', received_amount:398400},
    {case_id:caseId1, period:2, name:'開工款 30%', percentage:30, amount:398400, due_date:'2026-03-01', received:true, received_date:'2026-03-01', received_amount:398400},
    {case_id:caseId1, period:3, name:'完工款 40%', percentage:40, amount:531200, due_date:'2026-04-15', received:false},
    {case_id:caseId2, period:1, name:'簽約款 30%', percentage:30, amount:546000, due_date:'2025-11-20', received:true, received_date:'2025-11-20', received_amount:546000},
    {case_id:caseId2, period:2, name:'開工款 30%', percentage:30, amount:546000, due_date:'2025-12-01', received:true, received_date:'2025-12-01', received_amount:546000},
    {case_id:caseId2, period:3, name:'完工款 40%', percentage:40, amount:728000, due_date:'2026-03-15', received:false},
  ]);

  // ── 追加減 ──
  await knex('addons').insert([
    {case_id:caseId1, addon_no:'ADD-047-01', type:'減項', item:'主臥電視平台取消', reason:'業主決定不安裝電視', amount:-15000, status:'已確認', confirmed_by:'張先生', confirmed_at:new Date('2026-03-02'), designer_id:designer.id},
    {case_id:caseId1, addon_no:'ADD-047-02', type:'追加', item:'客廳電視牆加高20cm', reason:'業主希望延伸至天花板', amount:8500, status:'已確認', confirmed_by:'張先生', confirmed_at:new Date('2026-03-08'), designer_id:designer.id},
    {case_id:caseId1, addon_no:'ADD-047-03', type:'追加', item:'主臥增設嵌燈×4', reason:'原設計未含', amount:12000, status:'待確認', designer_id:designer.id},
  ]);

  // ── 工地 ──
  const [site1] = await knex('sites').insert({
    site_no:'SITE-047', case_id:caseId1, name:'大安區 張宅',
    address:'台北市大安區信義路XX號12F', latitude:25.033, longitude:121.543,
    radius:100, nfc_id:'NFC-047', current_stage:'木作施工', progress:68, start_date:'2026-03-01', est_end_date:'2026-04-15',
  }).returning('id');

  const [site2] = await knex('sites').insert({
    site_no:'SITE-043', case_id:caseId2, name:'信義區 李宅',
    address:'台北市信義區松仁路XX號5F', latitude:25.027, longitude:121.567,
    radius:100, nfc_id:'NFC-043', current_stage:'泥作施工', progress:90,
  }).returning('id');

  const siteId1 = site1.id||site1, siteId2 = site2.id||site2;

  // ── 廠商 ──
  const [v1] = await knex('vendors').insert({name:'李明木作工班',type:'木作',contact_name:'李明',phone:'0911-111-111',rating:4.8,rating_count:12,total_jobs:15,status:'active'}).returning('id');
  const [v2] = await knex('vendors').insert({name:'全誠油漆',type:'油漆',contact_name:'全哥',phone:'0922-222-222',rating:4.6,rating_count:8,total_jobs:10,status:'active'}).returning('id');
  const [v3] = await knex('vendors').insert({name:'明達泥作',type:'泥作',contact_name:'明達',phone:'0933-333-333',rating:4.5,rating_count:6,total_jobs:8,status:'active'}).returning('id');

  // ── 派工 ──
  await knex('work_orders').insert([
    {case_id:caseId1,site_id:siteId1,vendor_id:v1.id||v1,order_no:'WO-047-001',trade:'木作',amount:152500,scheduled_start:'2026-03-18',scheduled_end:'2026-04-05',status:'施工中',created_by:worker.id},
    {case_id:caseId1,site_id:siteId1,vendor_id:v2.id||v2,order_no:'WO-047-002',trade:'油漆',amount:76800,scheduled_start:'2026-04-01',scheduled_end:'2026-04-10',status:'待確認',created_by:worker.id},
    {case_id:caseId2,site_id:siteId2,vendor_id:v3.id||v3,order_no:'WO-043-001',trade:'泥作',amount:98000,scheduled_start:'2026-03-15',scheduled_end:'2026-03-28',status:'施工中',created_by:worker.id},
  ]);

  // ── 工班請款 ──
  await knex('vendor_claims').insert([
    {case_id:caseId1,vendor_id:v1.id||v1,claim_no:'CL-2026-001',stage:'完工款',items:JSON.stringify([{name:'系統衣櫃15尺',qty:15,price:5500,sub:82500}]),amount:82500,status:'已撥款',submitted_at:new Date('2026-03-20'),reviewed_by:manager.id,approved_by:manager.id,paid_date:'2026-03-25'},
    {case_id:caseId1,vendor_id:v1.id||v1,claim_no:'CL-2026-002',stage:'完工款',items:JSON.stringify([{name:'天花板3坪+電視牆',qty:1,price:67500,sub:67500}]),amount:67500,status:'已核准',submitted_at:new Date('2026-03-25'),reviewed_by:manager.id,approved_by:manager.id},
    {case_id:caseId2,vendor_id:v3.id||v3,claim_no:'CL-2026-003',stage:'中期款',items:JSON.stringify([{name:'浴室壁磚鋪貼',qty:1,price:45000,sub:45000}]),amount:45000,status:'待審核',submitted_at:new Date()},
  ]);

  // ── 打卡紀錄（最近7天）──
  const dates = [];
  for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); dates.push(d.toISOString().slice(0,10)); }
  for(const date of dates){
    await knex('checkins').insert({user_id:worker.id,site_id:siteId1,date,time:'08:15',type:'nfc',gps_verified:true,latitude:25.033,longitude:121.543}).catch(()=>{});
    if(dates.indexOf(date)<5){
      await knex('checkins').insert({user_id:worker.id,site_id:siteId2,date,time:'13:45',type:'nfc',gps_verified:true}).catch(()=>{});
    }
  }

  // ── 工程日誌（最近3天）──
  for(let i=0;i<3;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    const date=d.toISOString().slice(0,10);
    await knex('construction_logs').insert({
      case_id:caseId1,site_id:siteId1,user_id:worker.id,date,weather:['晴','陰','晴'][i],
      workers:JSON.stringify([{vendor:'李明木作',count:2}]),
      items:JSON.stringify(['木作天花板第'+(3-i)+'區完成','系統衣櫃進度']),
      progress:68-i*3,
      issues:JSON.stringify(i===0?['衣櫃五金缺料']:[]),
      photos:JSON.stringify([{url:'',desc:'施工照'}]),
      next_day_plan:'繼續木作', submitted_at:new Date(),
    }).catch(()=>{});
  }

  // ── 設計師巡查 ──
  await knex('inspections').insert({
    case_id:caseId1,site_id:siteId1,designer_id:designer.id,
    date:dates[2],week:'W12',checkin_time:'14:00',checkin_type:'nfc',
    photos:JSON.stringify([{url:'',desc:'天花板'},{url:'',desc:'衣櫃'}]),
    quality_checks:JSON.stringify({ceiling:'OK',wall:'OK',floor:'進行中',cabinet:'進行中',paint:'待施作'}),
    client_note:'業主對天花板高度滿意', issues:JSON.stringify([]),
  });

  // ── 客戶評分 ──
  await knex('client_ratings').insert([
    {case_id:caseId1,customer_id:custId1,designer_id:designer.id,stage:'signing',stage_label:'簽約階段',rating:5,comment:'設計師非常有耐心',rated_at:new Date('2026-02-14')},
    {case_id:caseId1,customer_id:custId1,designer_id:designer.id,stage:'proposal',stage_label:'設計提案',rating:4,comment:'整體設計很滿意',rated_at:new Date('2026-02-20')},
  ]);

  // ── 合約 ──
  await knex('contracts').insert({
    case_id:caseId1,contract_no:'CTR-2026-047',amount:1328000,sign_date:'2026-02-14',
    warranty_period:'2年',warranty_scopes:JSON.stringify([{area:'泥作',period:'1年'},{area:'水電',period:'2年'},{area:'木作',period:'1年'}]),
    status:'signed',
  });

  // ── 發票 ──
  await knex('invoices').insert([
    {invoice_no:'AB-12345678',type:'sales',case_id:caseId1,buyer_seller:'張先生',items:JSON.stringify([{name:'裝修工程款-簽約款',qty:1,price:398400}]),amount:398400,tax:19920,total:418320,period:'115年01-02月'},
    {invoice_no:'AB-12345679',type:'sales',case_id:caseId1,buyer_seller:'張先生',items:JSON.stringify([{name:'裝修工程款-開工款',qty:1,price:398400}]),amount:398400,tax:19920,total:418320,period:'115年03-04月'},
    {invoice_no:'CD-98765431',type:'purchase',case_id:caseId1,buyer_seller:'李明木作工班',vendor_id:v1.id||v1,items:JSON.stringify([{name:'木作工程',qty:1,price:82500}]),amount:82500,tax:4125,total:86625,period:'115年03-04月'},
  ]);

  // ── GP 月結 ──
  const month = new Date().toISOString().slice(0,7);
  await knex('gp_monthly').insert([
    {user_id:designer.id,month,earned:720,penalties:-26,total:694,level:3,streak:2,tasks_done:JSON.stringify(['st01','st02','st03','st05','st07','st09','st10']),reward_amount:6000},
    {user_id:worker.id,month,earned:580,penalties:-5,total:575,level:2,streak:2,tasks_done:JSON.stringify(['ss01','ss02','ss03','ss07']),reward_amount:3000},
    {user_id:manager.id,month,earned:880,penalties:-10,total:870,level:4,streak:3,tasks_done:JSON.stringify(['mg01','mg02','mg03','mg05','mg07']),reward_amount:15000},
    {user_id:finance.id,month,earned:650,penalties:0,total:650,level:2,streak:1,tasks_done:JSON.stringify(['fn01','fn02','fn04']),reward_amount:6000},
  ]);

  // ── 對話群組 ──
  const [g1] = await knex('chat_groups').insert({name:'大安張宅 施工群組',case_id:caseId1,type:'case'}).returning('id');
  const groupId1 = g1.id||g1;
  await knex('chat_members').insert([
    {group_id:groupId1,user_id:designer.id,role:'設計師'},
    {group_id:groupId1,user_id:worker.id,role:'工務'},
    {group_id:groupId1,user_id:manager.id,role:'店長'},
  ]);
  await knex('chat_messages').insert([
    {group_id:groupId1,user_id:designer.id,text:'張先生確認追加減了，衣櫃門片色號需再確認',read_by:JSON.stringify([designer.id])},
    {group_id:groupId1,user_id:worker.id,text:'收到，今天木作會完成第二區',read_by:JSON.stringify([worker.id])},
    {group_id:groupId1,user_id:designer.id,text:'好的，我週三會去巡查',read_by:JSON.stringify([designer.id])},
  ]);

  // ── 電子簽章 ──
  const [esDoc] = await knex('esign_documents').insert({case_id:caseId1,type:'追加減同意書',title:'主臥增設嵌燈×4 追加確認',amount:12000,status:'待簽署'}).returning('id');
  await knex('esign_signatures').insert([
    {document_id:esDoc.id||esDoc,role:'設計師',signer_name:'鄭博文',signer_user_id:designer.id,signed:true,signed_at:new Date()},
    {document_id:esDoc.id||esDoc,role:'業主確認',signer_name:'張先生'},
  ]);

  // ── 通知 ──
  await knex('notifications').insert([
    {user_id:designer.id,type:'checkin_remind',title:'打卡提醒',body:'今天還沒有工地打卡',channel:'system'},
    {user_id:worker.id,type:'log_remind',title:'日誌提醒',body:'請在17:30前完成工程日誌',channel:'system'},
    {user_id:manager.id,type:'payment_overdue',title:'收款逾期',body:'信義李宅完工款已逾期',channel:'system'},
  ]);

  console.log('✅ Demo seed data inserted');
};
