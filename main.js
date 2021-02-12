const CryptoJS = require("crypto-js");  // Hash Function
const merkle = require("merkle");       // Merkle Root
const fs = require("fs");               // File System

class BlockHeader {
    constructor(version, index, previousHeader, timestamp, merkleRoot){
        this.version = version;
        this.index = index;
        this.previousHeader = previousHeader;
        this.timestamp = timestamp;
        this.merkleRoot = merkleRoot;
    }
}

class Block {
    constructor(header, data){
        this.header = header;
        this.data = data;
    }
}

var blockChain = [getGenesisBlock()];

function getBlockChain(){
    return blockChain;
}

function getLatestBlock(){
    return blockChain[blockChain.length - 1];
}



function calculateHash(block){
    return CryptoJS.SHA256(block.header.version
                        + block.header.index 
                        + block.header.previousHash
                        + block.header.timestamp 
                        + block.header.merkleRoot).toString().toUpperCase();
}

function getCurrentVersion(){
    const packageJson = fs.readFileSync("./package.json");
    const currentVersion = JSON.parse(packageJson).version;

    return currentVersion;
}

function getCurrentTime(){
    return Math.round(new Date().getTime() / 1000);
}

function getGenesisBlock(){
    const version = "1.0.0";                // Arbitrary version
    const index = 0;                        // Zero length
    const previousHash = '0'.repeat(64);    // 0x000000...00
    const timestamp = 10000000;             // Current time
    const data = ["The Times 05/Feb/2021 Chancellor on brick of second bailout for banks"]; // Array

    const merkleTree = merkle("sha256").sync(data);
    const merkleRoot = merkleTree.root() || '0'.repeat(64);

    const header = new BlockHeader(version, index, previousHash, timestamp, data, merkleRoot);
    return new Block(header, data);
}

function generateNextBlock(blockData){
    const previousBlock = getLatestBlock();
    const currentVersion = getCurrentVersion();
    const nextIndex = previousBlock.header.index + 1;
    const previousHash = calculateHash(previousBlock);
    const timestamp = getCurrentTime();
    

    const merkleTree = merkle("sha256").sync(blockData); // Only arrays can be parameter of sync() method.
    const merkleRoot = merkleTree.root() || '0'.repeat(64);


    const newBlockHeader = new BlockHeader(currentVersion, nextIndex, previousHash, timestamp, merkleRoot);
    return new Block(newBlockHeader, blockData);
}

function isValidNewBlock(newBlock, previousBlock){
    if(!isValidNewBlockStructure(newBlock)){
        console.log('Invalid block structure : %s', JSON.stringify(newBlock));
        return false;
    }
    else if((previousBlock.header.index) + 1 !== newBlock.header.index){
        console.log("Invalid index");
        return false;
    }
    else if(calculateHash(previousBlock) !== newBlock.header.previousHeader){
        console.log("Invalid previousHash");
        return false;
    }
    else if((newBlock.data.length !== 0 && (merkle("sha256").sync(newBlock.data).root() !== newBlock.header.merkleRoot))
            || newBlock.data.length === 0 && ('0'.repeat(64) !== newBlock.header.merkleRoot)){
        console.log("Invalid merkleRoot");
        return false;
    }
    return true;
}

function isValidNewBlockStructure(block){
    return typeof(block.header.version) == 'string'
        && typeof(block.header.index) == 'number'
        && typeof(block.header.previousHeader) == 'string'
        && typeof(block.header.timestamp) == 'number'
        && typeof(block.header.merkleRoot) == 'string'
        && typeof(block.data) == 'object';
}

function isValidChain(blockChainToValidate){
    if(JSON.stringify(blockChainToValidate[0]) !== JSON.stringify(getGenesisBlock())){
        return false;
    }
    var tempBlocks = [blockChainToValidate[0]];
    for(var count = 1; count < blockChainToValidate.length; count++){
        if(isValidNewBlock(blockChainToValidate[count], tempBlocks[count - 1])){
            tempBlocks.push(blockChainToValidate[count]);
        }
        else{
            return false;
        }
    }
    return true;

}

function addBlock(newBlock){
    if(isValidNewBlock(newBlock, getLatestBlock())){
        blockChain.push(newBlock);
        return true;
    }
    return false;
}

var data = ['SONG'];

addBlock(generateNextBlock(data));

isValidChain(blockChain);