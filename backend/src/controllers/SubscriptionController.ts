import { Request, Response } from "express";
import express from "express";
import * as Yup from "yup";
import Gerencianet from "gn-api-sdk-typescript";
import AppError from "../errors/AppError";
import options from "../config/Gn";
import Company from "../models/Company";
import Invoices from "../models/Invoices";
import Setting from "../models/Setting";
import Subscriptions from "../models/Subscriptions";
import { getIO } from "../libs/socket";
import UpdateUserService from "../services/UserServices/UpdateUserService";
//import Stripe from 'stripe';
var axios = require('axios');

const app = express();

export const index = async (req: Request, res: Response): Promise<Response> => {
  const gerencianet = Gerencianet(options);
  console.log("Dentro do Index Subscription");
  console.log(gerencianet);
  return res.json(gerencianet.getSubscriptions());
};

export const createSubscription = async (
  req: Request,
  res: Response
  ): Promise<Response> => {

  //let mercadopagoURL;
  let stripeURL;
  let pix;
  let qrcode;
  let asaasURL;
  //let key_STRIPE_PRIVATE = process.env.STRIPE_PRIVATE;
  let key_MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  let key_GERENCIANET_PIX_KEY = process.env.GERENCIANET_PIX_KEY;
  //let key_ASAAS_TOKEN = process.env.ASAAS_TOKEN;



  const gerencianet = Gerencianet(options);
  const { companyId } = req.user;

  const schema = Yup.object().shape({
    price: Yup.string().required(),
    users: Yup.string().required(),
    connections: Yup.string().required()
  });

  if (!(await schema.isValid(req.body))) {
    console.log("Erro linha 32")
    throw new AppError("Dados Incorretos - Contate o Suporte!", 400);
  }  

  const {
    firstName,
    price,
    users,
    connections,
    address2,
    city,
    state,
    zipcode,
    country,
    plan,
    invoiceId
  } = req.body;


const valor = Number(price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", "."));
const valorext = price;


async function createMercadoPagoPreference() {
  if (key_MP_ACCESS_TOKEN) {
    const mercadopago = require("mercadopago");
    mercadopago.configure({
      access_token: key_MP_ACCESS_TOKEN
    });

    let preference = {
      external_reference: String(invoiceId),
      notification_url: String(process.env.MP_NOTIFICATION_URL),
      items: [
        {
          title: `#Fatura:${invoiceId}`,
          unit_price: valor,
          quantity: 1
        }
      ]
    };

    try {
      const response = await mercadopago.preferences.create(preference);
      //console.log("mercres", response);
      let mercadopagoURLb = response.body.init_point;
      //console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
      //console.log(mercadopagoURLb);
      return mercadopagoURLb; // Retorna o valor para uso externo
    } catch (error) {
      console.log(error);
      return null; // Em caso de erro, retorna null ou um valor padrão adequado
    }
  }
}

const mercadopagoURL = await createMercadoPagoPreference();


//console.log(asaasURL);


if(key_GERENCIANET_PIX_KEY){

  const body = {
    calendario: {
      expiracao: 3600
    },
    valor: {
      original: price.toLocaleString("pt-br", { minimumFractionDigits: 2 }).replace(",", ".")
    },
    chave: key_GERENCIANET_PIX_KEY,
    solicitacaoPagador: `#Fatura:${invoiceId}`
    };

  try {
  
    pix = await gerencianet.pixCreateImmediateCharge(null, body);

    qrcode = await gerencianet.pixGenerateQRCode({
      id: pix.loc.id
    });

    

  } catch (error) {
    console.log(error);
    //throw new AppError("Validation fails", 400);
  }

}

const updateCompany = await Company.findOne();

if (!updateCompany) {
	throw new AppError("Company not found", 404);
}

	return res.json({
      ...pix,
      valorext,
      qrcode,
	  stripeURL,
      mercadopagoURL,
      asaasURL,
    });


};

export const createWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const schema = Yup.object().shape({
    chave: Yup.string().required(),
    url: Yup.string().required()
  });

  console.log(req.body);

  try {
    await schema.validate(req.body, { abortEarly: false });
  } catch (err) {
    if (err instanceof Yup.ValidationError) {
      const errors = err.errors.join('\n');
      throw new AppError(`Validation error(s):\n${errors}`, 400);
    } else {
      throw err;
    }
  }

  const { chave, url } = req.body;

  const body = {
    webhookUrl: url
  };

  const params = {
    chave
  };

  try {
    const gerencianet = Gerencianet(options);
    const create = await gerencianet.pixConfigWebhook(params, body);
    return res.json(create);
  } catch (error) {
    console.log(error);
  }
};

export const webhook = async (
  req: Request,
  res: Response
  ): Promise<Response> => {
  const { type } = req.params;
  const { evento } = req.body;

  //console.log(req.body);
  //console.log(req.params);

  if (evento === "teste_webhook") {
    return res.json({ ok: true });
  }
  if (req.body.pix) {
    const gerencianet = Gerencianet(options);
    req.body.pix.forEach(async (pix: any) => {
      const detahe = await gerencianet.pixDetailCharge({
        txid: pix.txid
      });

      if (detahe.status === "CONCLUIDA") {
        const { solicitacaoPagador } = detahe;
        const invoiceID = solicitacaoPagador.replace("#Fatura:", "");
        const invoices = await Invoices.findByPk(invoiceID);
        const companyId =invoices.companyId;
        const company = await Company.findByPk(companyId);
    
        const expiresAt = new Date(company.dueDate);
        expiresAt.setDate(expiresAt.getDate() + 30);
        const date = expiresAt.toISOString().split("T")[0];

        if (company) {
          await company.update({
            dueDate: date
          });
         const invoi = await invoices.update({
            id: invoiceID,
         	txid: pix.txid,
            status: 'paid'
          });
          await company.reload();
          const io = getIO();
          const companyUpdate = await Company.findOne({
            where: {
              id: companyId
            }
          });

          io.emit(`company-${companyId}-payment`, {
            action: detahe.status,
            company: companyUpdate
          });
        }

      }
    });

  }

  return res.json({ ok: true });
};




export const stripewebhook = async (
  req: Request,
  res: Response
  ): Promise<Response> => {
  const { type } = req.params;
  const { evento } = req.body;

  //console.log(req.body);
  //console.log(req.params);

  if (req.body.data.object.id) {
   
      if (req.body.type === "checkout.session.completed") {
      
        const stripe_id = req.body.data.object.id;
      
        const invoices = await Invoices.findOne({ where: { stripe_id: stripe_id } });
		const invoiceID = invoices.id;
      
        const companyId = invoices.companyId;
        const company = await Company.findByPk(companyId);
    
        const expiresAt = new Date(company.dueDate);
        expiresAt.setDate(expiresAt.getDate() + 30);
        const date = expiresAt.toISOString().split("T")[0];

        if (company) {
          await company.update({
            dueDate: date
          });
         const invoi = await invoices.update({
            id: invoiceID,
            status: 'paid'
          });
          await company.reload();
          const io = getIO();
          const companyUpdate = await Company.findOne({
            where: {
              id: companyId
            }
          });

          io.emit(`company-${companyId}-payment`, {
            action: 'CONCLUIDA',
            company: companyUpdate
          });
        }
      
    }
  
  }

return res.json({ ok: true });
  
};


export const mercadopagowebhook = async (
  req: Request,
  res: Response
): Promise<void> => {

  //console.log(req.body);
  //console.log(req.params);


  let key_MP_ACCESS_TOKEN = null;


  try {
    
    const buscacompanyId = 1;
  
  
    const getmptoken = await Setting.findOne({
      where: { companyId: buscacompanyId, key: "mpaccesstoken" },
    });
    key_MP_ACCESS_TOKEN = getmptoken?.value;
  
  } catch (error) {
    console.error("Error retrieving settings:", error);
  }

  const mercadopago = require("mercadopago");
  mercadopago.configure({
    access_token: key_MP_ACCESS_TOKEN,
  });
  
  //console.log("*********************************");
  //console.log(req.body.id);
  //console.log("*********************************");

  if (req.body.action === "payment.updated") {
  
  
  	try {
    	const payment = await mercadopago.payment.get(req.body.data.id);
    
    	console.log('DETALHES DO PAGAMENTO:', payment.body);
        console.log('ID DA FATURA:', payment.body.external_reference);
    
    	if(!payment.body.transaction_details.transaction_id){
        	console.log('SEM PAGAMENTO:', payment.body.external_reference);
        	return;
        }

    	const invoices = await Invoices.findOne({ where: { id: payment.body.external_reference } });
		const invoiceID = invoices.id;
    
    	if (invoices && invoices.status === "paid") {
        	console.log('FATURA JÁ PAGA');
            return;
        }
      
        const companyId = invoices.companyId;
        const company = await Company.findByPk(companyId);
    
        const expiresAt = new Date(company.dueDate);
        expiresAt.setDate(expiresAt.getDate() + 30);
        const date = expiresAt.toISOString().split("T")[0];

        if (company) {
          await company.update({
            dueDate: date
          });
         const invoi = await invoices.update({
            id: invoiceID,
            txid: payment.body.transaction_details.transaction_id,
            status: 'paid'
          });
          await company.reload();
          const io = getIO();
          const companyUpdate = await Company.findOne({
            where: {
              id: companyId
            }
          });

          io.emit(`company-${companyId}-payment`, {
            action: 'CONCLUIDA',
            company: companyUpdate
          });
        }

    	res.status(200).json(payment.body);
  	} catch (error) {
    	console.error('Erro ao tentar ler o pagamento:', error);
    	res.status(500).json({ error: 'Erro ao identificar o pagamento' });
  	}  
  
  
  }

  
};


export const asaaswebhook = async (
  req: Request,
  res: Response
): Promise<void> => {

  console.log(req.body);
  console.log(req.params);

  res.status(200).json(req.body);

};