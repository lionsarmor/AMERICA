// Employer credentials and browser sessions never leave the private worker.
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,chmod} from 'node:fs/promises';
import {join} from 'node:path';
export async function createApplicationVault(directory){
 await mkdir(directory,{recursive:true,mode:0o700});await chmod(directory,0o700);
 const keyPath=join(directory,'vault.key');let key;
 try{key=await readFile(keyPath);}catch(e){if(e.code!=='ENOENT')throw e;key=randomBytes(32);await writeFile(keyPath,key,{mode:0o600,flag:'wx'});}
 const pathFor=scope=>join(directory,createHash('sha256').update(scope).digest('hex')+'.vault');
 return {
  async read(scope){try{const data=await readFile(pathFor(scope));const decipher=createDecipheriv('aes-256-gcm',key,data.subarray(0,12));decipher.setAuthTag(data.subarray(12,28));return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString());}catch(e){if(e.code==='ENOENT')return {};throw e;}},
  async write(scope,value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv),body=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);const path=pathFor(scope),tmp=path+'.'+randomBytes(6).toString('hex');await writeFile(tmp,Buffer.concat([iv,cipher.getAuthTag(),body]),{mode:0o600});await rename(tmp,path);}
 };
}
