import PdfPrinter from "pdfmake";
import imageToBase64 from "image-to-base64";

export const createCVPdf = async (id, user) => {
  const fonts = {
    Roboto: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  };

  const printer = new PdfPrinter(fonts);

  const profilePicBase64 = await imageToBase64(user.image);
  const profilePic = "data:image/jpeg;base64," + profilePicBase64;

  const docDefinition = {
    content: [
      {
        image: "profilePicture",
        width: 450,
        alignment: "center",
      },
      {
        text: "\n" + user.name + " " + user.surname + "\n\n",
        style: "header",
        alignment: "center",
      },
      {
        text: "\n" + user.area + "\n\n",
        style: "subheader",
        alignment: "center",
      },
      {
        text: user.email,
        alignment: "left",
      },
      {
        text: "\n" + user.bio + "\n\n",
        alignment: "justify",
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
      },
      subheader: {
        fontSize: 15,
        bold: true,
      },
      quote: {
        italics: true,
      },
      small: {
        fontSize: 8,
      },
      defaultStyle: {
        font: "Helvetica",
      },
    },
    images: {
      profilePicture: profilePic,
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition);

  pdfReadableStream.end();

  return pdfReadableStream;
};
