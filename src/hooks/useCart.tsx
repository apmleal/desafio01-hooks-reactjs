import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const oldCart = [...cart];
      const productExists = oldCart.find((product) => product.id === productId);

      const responseStock = await api.get(`/stock/${productId}`);
      const stockAmount = responseStock.data.amount;

      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = amount;
      } else {
        const responseProduct = await api.get(`/products/${productId}`);

        const newProduct = {
          ...responseProduct.data,
          amount: amount,
        };

        oldCart.push(newProduct);
      }
      setCart(oldCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(oldCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const oldCart = [...cart];
      const productIndex = oldCart.findIndex(
        (product) => product.id === productId
      );

      if (productIndex >= 0) {
        oldCart.splice(productIndex, 1);
        setCart(oldCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(oldCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const responseStock = await api.get(`/stock/${productId}`);
      const stockAmount = responseStock.data.amount;

      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const oldCart = [...cart];
      const productIndex = oldCart.find((product) => product.id === productId);
      if (productIndex) {
        productIndex.amount = amount;
        setCart(oldCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(oldCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
