

// (async () => {
//   init();

//   await page.goto('https://fitgirl-repacks.site/all-my-repacks-a-z/');

//   let morePages = true;
//     let pageUrls = [];
//     while (morePages) {
//         // Extraer URLs de las subpáginas
//         const pageLinks = await page.evaluate(() => Array.from(document.querySelectorAll("#lcp_instance_0 a"), a => a.href));
//         pageUrls = pageUrls.concat(pageLinks);
//         // Verificar si hay un botón de "siguiente página"
//         const nextButton = await page.$('.lcp_nextlink');
//         if (nextButton) {
//             // Hacer clic en el botón de "siguiente página"
//             await nextButton.click();
//             // Esperar a que la página cargue
//             await page.waitForNavigation();
//         } else {
//             morePages = false;
//         }
//     }
//     // Cerrar navegador
//     await browser.close();
//     console.log(pageUrls);
// })();


const puppeteer = require('puppeteer');
const MongoClient = require('mongodb').MongoClient;

(async () => {
    const browser =  await puppeteer.launch({
        // headless: false,
        // slowMo: 25
      });
    const page = await browser.newPage();

    const url = 'mongodb://localhost:27017';
    const client = new MongoClient(url, { useNewUrlParser: true });
    await client.connect();

    const db = client.db('mydatabase');
    const collection = db.collection('santafe');

    await page.goto('https://www.santafe.gob.ar/examenlicencia/examenETLC/listarCuestionarios.php');


    counter = 0


    while(counter < 50){

        let div_selector_to_remove= ".columna-mid";
        await page.evaluate((sel) => {
            var elements = document.querySelectorAll(sel);
            for(var i=0; i< elements.length; i++){
                elements[i].parentNode.removeChild(elements[i]);
            }
        }, div_selector_to_remove)

        const option = (await page.$x('//*[@id = "idcm_sel"]/option[text() = "Cuestionario para Clase A3"]'))[0];
        const value = await (await option.getProperty('value')).jsonValue();
        await page.select('#idcm_sel', value);
        

        await page.click('input[name^=comenzar]');
        await page.waitForSelector('form');
        await page.$eval('form', el => el.onsubmit = 'true');

        await page.click('input[name^=enviar]');
        await page.waitForSelector('.rightanswer strong');
        await page.$eval('.rightanswer strong', el => el.value = '');

        const pageQuestions = await page.evaluate(() => Array.from(document.querySelectorAll(".formulation"), element => ({
            _id: element.querySelector(".r0 input").name, 
            question: element.querySelector(".qtext").textContent,
            answers: Array.from(element.querySelectorAll(".r0 label")).map(node =>  node.textContent),
            correctAnswer: element.parentElement.querySelector(".rightanswer").textContent.trim().replaceAll("[(\\n)*](\\t)*", "").replaceAll("Respuesta correcta: ", ""),
            image: element.querySelector("img")?.src ?? ''
            })
        ));
        console.log(pageQuestions)

        collection.insertMany(pageQuestions).catch(()=>{})

        counter++
        await page.click('input[name^=otro]');
    }

    // Cerrar navegador
    await browser.close();

    await client.close();
})();

