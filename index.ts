import * as crypto from 'crypto';

// Transfer of funds between two Accounts
class Vote {
  constructor(
    public vote: number, 
    public voter: string, // public key
    public party: string // public key
  ) {}

  toString() {
    return JSON.stringify(this);
  }
}

// Individual block on the chain
class Block {

  public nonce = Math.round(Math.random() * 999999999);

  constructor(
    public prevHash: string, 
    public name: string,
    public vote: Vote, 
    public ts = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}


// The blockchain
class Chain {
  // Singleton instance
  public static instance = new Chain();

  chain: Block[];

  constructor() {
    this.chain = [
      // Genesis block
      new Block('','Genesis Node' , new Vote(0, 'genesis', 'satoshi'))
    ];
  }

  // Most recent block
  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  // Proof of work system
  mine(nonce: number) {
    let solution = 1;
    console.log('⛏️  mining...')

    while(true) {

      const hash = crypto.createHash('MD5');
      hash.update((nonce + solution).toString()).end();

      const attempt = hash.digest('hex');

      if(attempt.substr(0,4) === '0000'){
        console.log(`Solved: ${solution}`);
        return solution;
      }

      solution += 1;
    }
  }

  // Add a new block to the chain if valid signature & proof of work is complete
  addBlock(vote: Vote, name: string, senderPublicKey: string, signature: Buffer) {
    const verify = crypto.createVerify('SHA256');
    verify.update(vote.toString());

    const isValid = verify.verify(senderPublicKey, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, name ,vote);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }

}

// Account gives a user a public/private keypair
class Account {
  public publicKey: string;
  public privateKey: string;
  public accName: string;
  public numberOfVotes: number = 0;

  constructor(name: string) {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    this.accName = name;
    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  castVote(name: string, voterPublicKey: string){
    const vote = new Vote(1, this.publicKey, voterPublicKey);

    const sign = crypto.createSign("SHA256");
    sign.update(vote.toString()).end();

    const signature = sign.sign(this.privateKey);
    this.numberOfVotes += 1;
    Chain.instance.addBlock(vote, name,this.publicKey, signature);
  }

  public getVotes (){
    return `${this.accName} got ${this.numberOfVotes} votes`
  }
}

// Example usage

const satoshi = new Account('satoshi');
const bob = new Account('bob');
const alice = new Account('alice');
const yarooq = new Account('yarooq');

yarooq.castVote( 'yarooq votes for bob', bob.publicKey);
satoshi.castVote('satoshi votes for alice', alice.publicKey);

console.log(Chain.instance);
console.log(satoshi.getVotes())
console.log(bob.getVotes())
console.log(alice.getVotes())
console.log(yarooq.getVotes())


