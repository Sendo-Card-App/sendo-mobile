module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Plugin pour charger les variables d'environnement du fichier .env
      "module:react-native-dotenv",
    ],
  };
};
