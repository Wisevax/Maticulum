import React, { Component } from "react";
import { Button, Card, Form, Container, Row, Col } from 'react-bootstrap';
import Web3Context from "../Web3Context";
import { withTranslation } from "react-i18next";
import background from './pdf/assets/background.jpg';
import axios from "axios";

class DiplomeMulti extends Component {
	static contextType = Web3Context;
	
	state = { linkDiplome : 'Diplome', linkVisible:false,
	hashImage:null,hashJson:null,fileToUpload:null, isButtonMetamaskVisible : false,
	showDownload: false, firstname: '', lastname: '', title: '',formData:null,
	files:null, hashes:[], pinataApiKey: '',
	pinataSecretApiKey:'',sendNFTVisibility:false  };
	
	handleFile = async(e) => {
		const { files, pinataSecretApiKey, pinataApiKey, file} = this.state; 	
		let filesImages = e.target.files;
		this.setState({ files : filesImages, linkVisible:true });
	}
	
	getJsonData = async (urlImage) => {
		const { hashes, file, sendNFTVisibility} = this.state; 				
		const data ={ 
			"name": "DiplomeMaticulum",
			"image": urlImage,
			"description": "Diplome NFT hébergé par le smart contract MaticulumNFT"
		};
						
		const JSONBody = JSON.parse(JSON.stringify(data));
		
		const pinataApiKey = this.getPinataApiKey();
		const pinataSecretApiKey = this.getPinataSecretApiKey();
			
		
		const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS/`;
		return axios.post(url, JSONBody, {
            headers: {
                pinata_api_key: pinataApiKey,
                pinata_secret_api_key: pinataSecretApiKey
            }
        })
        .then(async (response) => {
            let ipfsHash = response.data.IpfsHash;	
			let urlMetadata = "https://gateway.pinata.cloud/ipfs/" + ipfsHash;			
			hashes.push(ipfsHash);
			alert(urlMetadata);
			this.setState({ hashJson : ipfsHash, isButtonMetamaskVisible:true,sendNFTVisibility : true});
        })
        .catch(function (error) {
            //handle error here
        }); 
	 
	};
	
	// gestion si annulation envoi diplôme
	onSendOneImage = async(formData, recipeUrl, postHeader) =>{	
		axios({
		  url: recipeUrl,
		  method: "POST",
		  headers: postHeader,
		  data: formData,
		})
		  .then(async (res) => { 
			let ipfsHash = res.data.IpfsHash;
			let urlMetadata = "https://gateway.pinata.cloud/ipfs/" + ipfsHash;	
						
			this.setState({ linkDiplome : urlMetadata, linkVisible:true,
			hashImage:ipfsHash});
			await this.getJsonData(urlMetadata);
		  }) 
		  .catch((err) => { alert(err); });
	}
	
	createImagePinataAxios = async(e) => {		
		const { files} = this.state; 
		const recipeUrl = 'https://api.pinata.cloud/pinning/pinFileToIPFS/';		
		
		const pinataApiKey = this.getPinataApiKey();
		const pinataSecretApiKey = this.getPinataSecretApiKey();
		
	    const postHeader = {
			pinata_api_key: pinataApiKey,
			pinata_secret_api_key: pinataSecretApiKey
		};

		for(let i =0;i<files.length;i++){
			let formData = new FormData();
			formData.append("file", files[i]);
			await this.onSendOneImage(formData, recipeUrl, postHeader);
		}
		
	}
	
	SendNFT = async() => { 
		const { hashes} = this.state;
		await this.context.contract.methods.createDiplomeNFTs(this.context.account,hashes).send({from:this.context.account});			
	}
	
	getPinataApiKey(){
		let paramPinataApiKey = 'YWE2MGZmZTk3YjJlMTY0MTlkYmFhbnQ=';
		return atob(paramPinataApiKey).split(this.mdp.value)[0];
	}
	
	getPinataSecretApiKey(){
		let paramPinataSecretApiKey = 'YTRiZTFhMmE4NWQwNWQ2ZTM1MGExM2I4MjA0OWU0OWMxYWZlOWJiMzE3NTMxOTYzZTIzMWYwYTAzZDJhNzE1OGFudA==';
		return atob(paramPinataSecretApiKey).split(this.mdp.value)[0];		
	}
	
	decryptKey = async() =>{
		const { files, pinataSecretApiKey, pinataApiKey} = this.state;		
		
		let paramPinataApiKey = 'YWE2MGZmZTk3YjJlMTY0MTlkYmFhbnQ=';
		var decodedPinataApiKey = atob(paramPinataApiKey).split(this.mdp.value)[0];
		
		let paramPinataSecretApiKey = 'YTRiZTFhMmE4NWQwNWQ2ZTM1MGExM2I4MjA0OWU0OWMxYWZlOWJiMzE3NTMxOTYzZTIzMWYwYTAzZDJhNzE1OGFudA==';
		var decodedPinataSecretApiKey = atob(paramPinataSecretApiKey).split(this.mdp.value)[0];		
		
		this.setState({ pinataSecretApiKey : decodedPinataSecretApiKey, pinataApiKey: decodedPinataApiKey});
	}
		
	
		
	render() {
		const { t } = this.props; 
		
		return(
		<div style={{display: 'flex', justifyContent: 'center'}}>
		  <Card style={{ width: '50rem' }}>
			
			
            <Card.Header><strong>{t('diplome.sendNFT')}</strong></Card.Header>
            <Card.Body>			  
				<input type="file" id="avatar" accept="image/png, image/jpeg" 
				 multiple="multiple"	onChange={this.handleFile} />
			</Card.Body>
			Clé pour envoyer le NFT sur IPFS :
			<Form.Control type="password" id="mdp" ref={(input) => { this.mdp = input }} />
			
			{ 
				this.state.linkVisible ? 
				<Card.Body>
					<Button onClick={this.createImagePinataAxios}>{t('diplome.createNFT')}</Button>
				</Card.Body>
				: null
			}
			
			{ 
				this.state.sendNFTVisibility ? 
				<Card.Body>
					<Button onClick={this.SendNFT}>Envoi NFT</Button>
				</Card.Body>
				: null
			}
			 
			
          </Card>
        </div>	

		
		);
	}
}

export default withTranslation()(DiplomeMulti);