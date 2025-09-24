declare module "iyzipay" {
  export interface CheckoutFormInitializeRequest {
    locale?: string;
    conversationId: string;
    price: string;
    paidPrice: string;
    currency: string;
    basketId: string;
    paymentGroup: string;
    callbackUrl: string;
    buyer: any;
    shippingAddress: any;
    billingAddress: any;
    basketItems: any[];
  }

  export interface CheckoutFormInitializeResponse {
    status: string;
    checkoutFormContent: string;
    token?: string;
    errorCode?: string;
    errorMessage?: string;
  }

  export interface CheckoutFormRetrieveRequest {
    token: string;
  }

  export interface CheckoutFormRetrieveResponse {
    status: string; // "success" veya "failure"
    paymentStatus?: "SUCCESS" | "FAILURE";
    paymentId?: string;
    paymentItems?: any[];
    errorCode?: string;
    errorMessage?: string;
    token?: string;
  }

  namespace Iyzipay {
    interface CheckoutFormInitializeRequest {
      locale?: string;
      conversationId: string;
      price: string;
      paidPrice: string;
      currency: string;
      basketId: string;
      paymentGroup: string;
      callbackUrl: string;
      buyer: any;
      shippingAddress: any;
      billingAddress: any;
      basketItems: any[];
    }

    interface CheckoutFormInitializeResponse {
      status: string;
      checkoutFormContent: string;
      token?: string;
      errorCode?: string;
      errorMessage?: string;
    }

    interface CheckoutFormRetrieveRequest {
      token: string;
    }

    interface CheckoutFormRetrieveResponse {
      status: string;
      paymentStatus?: "SUCCESS" | "FAILURE";
      paymentId?: string;
      paymentItems?: any[];
      errorCode?: string;
      errorMessage?: string;
      token?: string;
    }

    const LOCALE: {
      TR: string;
      EN: string;
    };

    const CURRENCY: {
      TRY: string;
      USD: string;
      EUR: string;
    };

    const PAYMENT_GROUP: {
      PRODUCT: string;
      LISTING: string;
      SUBSCRIPTION: string;
    };

    const BASKET_ITEM_TYPE: {
      PHYSICAL: string;
      VIRTUAL: string;
    };
  }

  const Iyzipay: any;
  export default Iyzipay;
}
