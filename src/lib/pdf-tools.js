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

  const convertToURI = async (image) => {
    const imageBase64 = await imageToBase64(image);
    const imageURI = "data:image/jpeg;base64," + imageBase64;
    return imageURI;
  };

  const profilePic = await convertToURI(user.image);

    // const newImageObject = await user.experiences.map(async (experience, i) => {
    //   const expImageBase64 = await imageToBase64(experience.image);
    //   const expImage = "data:image/jpeg;base64," + expImageBase64;
    //   const imgObjectPropertyPhrase = "expPic" + i.toString();
    //   imageObject[imgObjectPropertyPhrase] = expImage;
    // });

  //   declare separate content and populate with superficial User Info

  

  // Add Experiences text + images to content
  const experiencesPDFArray = [];

  for (let i = 0; i < user.experiences.length; i++) {
    experiencesPDFArray.push({
      columns: [
        // {
        //   image: "expPic" + i.toString(),
        //   width: 100,
        //   alignment: "left",
        // },
        {
          text: "\n" + "PLACEHOLDER" + "\n\n",
          style: "subheader",
          alignment: "center",
        },
        {
          text: "\n" + user.experiences[i].role + "\n\n" + user.experiences[i].company,
          style: "subheader",
          alignment: "center",
        },
      ],
    });
  }

  const content = [
    {
      alignment: "justify",
      columns: [
        {
          image: "profilePicture",
          width: 200,
          alignment: "center",
        },
        {
          text: "\n\n\n\n\n" + user.name + " " + user.surname + "\n\n",
          style: "header",
          alignment: "center",
        },
      ],
    },
    {
      text: "\n" + user.title + "\n\n",
      style: "subheader",
      alignment: "center",
    },
    {
      text: "\n" + user.area + "\n\n\n\n",
      style: "subheader",
      alignment: "center",
    },
    {
      text: user.email,
      alignment: "left",
    },
    {
      text: "\n Bio: " + user.bio + "\n\n",
      alignment: "justify",
    },
    {
      text: "\n" + "Experiences:" + "\n\n",
    },
    ...experiencesPDFArray
  ];

  const styles = {
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
  };

  const docDefinition = {
    content: content,
    styles: styles,
    images: {
      profilePicture: profilePic,
    },
  };

  const pdfReadableStream = printer.createPdfKitDocument(docDefinition);

  pdfReadableStream.end();

  return pdfReadableStream;
};
