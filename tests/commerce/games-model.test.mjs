import assert from 'node:assert/strict';import fs from 'node:fs';import {groups,search} from '../../experiences/games/model.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../experiences/games/catalog.json',import.meta.url))).games;
assert.equal(catalog.length,3);assert.equal(groups(catalog).find(g=>g.name==='Solana').games[0].id,'star-atlas');assert.equal(groups(catalog).find(g=>g.name==='Unclassified').games.length,2);assert.equal(search(catalog,'atlas','Solana').length,1);assert.equal(search(catalog,'not-a-game-query').length,0);
assert.equal(groups([{id:'evil',name:'bad',website:'javascript:alert(1)'}]).length,0);assert.equal(groups([{...catalog[0],ecosystem:'Invented',ecosystem_evidence:null}])[0].name,'Unclassified');assert.equal(groups([catalog[0],catalog[0]]).flatMap(g=>g.games).length,1);
for(const game of catalog){assert(game.source_review.evidence.length);assert.equal(game.rewards_status,'not verified');assert.equal(game.playability_status,'not tested');}
console.log('Games catalog/model checks passed: three real records, evidenced ecosystems, unknown preservation, safe links, search and duplicate protection.');
