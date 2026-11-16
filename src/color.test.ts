import {describe,it,expect} from 'vitest';
import {hexToHsv,hsvToHex} from './color';

describe('color picker',()=>{
 it('starts neutral colors at the brand hue, not black',()=>{expect(hexToHsv('#ffffff')).toEqual({h:348,s:0,v:100});expect(hsvToHex(hexToHsv('#ffffff'))).toBe('#ffffff')});
 it('keeps a chosen color when opening the picker',()=>{for(const hex of ['#a94354','#608f87','#292d2b','#f5f2ee'])expect(hsvToHex(hexToHsv(hex))).toBe(hex)});
});
