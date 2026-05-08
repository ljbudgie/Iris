import { customProvider, gateway } from "ai";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": titleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  if (process.env.IRIS_LOCAL_ONLY === "1") {
    throw new Error(
      `Local-only mode is enabled, so cloud model "${modelId}" cannot be used. Configure a local provider before chatting.`
    );
  }

  return gateway.languageModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  if (process.env.IRIS_LOCAL_ONLY === "1") {
    throw new Error(
      "Local-only mode is enabled, so cloud title generation cannot be used."
    );
  }
  return gateway.languageModel(titleModel.id);
}
