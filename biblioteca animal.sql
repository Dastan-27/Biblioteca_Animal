/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `bibliotecaanimal` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `bibliotecaanimal`;

CREATE TABLE IF NOT EXISTS `animales` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) NOT NULL,
  `NombreCientifico` varchar(150) DEFAULT NULL,
  `Clasificacion_ID` int(11) NOT NULL,
  `TiempoVidaMin` int(11) DEFAULT NULL,
  `TiempoVidaMax` int(11) DEFAULT NULL,
  `Habitat_ID` int(11) NOT NULL,
  `Clima_ID` int(11) NOT NULL,
  `Alimentacion_ID` int(11) NOT NULL,
  `Reproduccion_ID` int(11) NOT NULL,
  `Descripcion` text DEFAULT NULL,
  `FechaRegistro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ID`),
  KEY `Clasificacion_ID` (`Clasificacion_ID`),
  KEY `Habitat_ID` (`Habitat_ID`),
  KEY `Clima_ID` (`Clima_ID`),
  KEY `Alimentacion_ID` (`Alimentacion_ID`),
  KEY `Reproduccion_ID` (`Reproduccion_ID`),
  CONSTRAINT `animales_ibfk_1` FOREIGN KEY (`Clasificacion_ID`) REFERENCES `clasificaciones` (`ID`),
  CONSTRAINT `animales_ibfk_2` FOREIGN KEY (`Habitat_ID`) REFERENCES `subtiposhabitat` (`ID`),
  CONSTRAINT `animales_ibfk_3` FOREIGN KEY (`Clima_ID`) REFERENCES `climas` (`ID`),
  CONSTRAINT `animales_ibfk_4` FOREIGN KEY (`Alimentacion_ID`) REFERENCES `tiposalimentacion` (`ID`),
  CONSTRAINT `animales_ibfk_5` FOREIGN KEY (`Reproduccion_ID`) REFERENCES `tiposreproduccion` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `animales` (`ID`, `Nombre`, `NombreCientifico`, `Clasificacion_ID`, `TiempoVidaMin`, `TiempoVidaMax`, `Habitat_ID`, `Clima_ID`, `Alimentacion_ID`, `Reproduccion_ID`, `Descripcion`, `FechaRegistro`) VALUES
	(7, 'Le?n', 'Panthera leo', 1, 10, 14, 2, 1, 2, 3, 'Gran felino social que vive en manadas. Conocido como el rey de la selva.', '2025-11-24 22:31:22'),
	(9, 'Boa constrictor', 'Boa constrictor', 3, 20, 30, 6, 1, 2, 2, 'Serpiente no venenosa que mata por constricci?n.', '2025-11-24 22:32:20'),
	(10, 'Elefante africano', 'Loxodonta africana', 1, 60, 70, 2, 1, 1, 3, 'El animal terrestre m?s grande del mundo. Vive en manadas matriarcales.', '2025-11-24 22:35:28'),
	(11, 'Ping?ino emperador', 'Aptenodytes forsteri', 2, 15, 20, 1, 4, 5, 1, '?nico ping?ino que se reproduce durante el invierno ant?rtico. Excelente buceador.', '2025-11-24 22:35:28'),
	(12, 'Mariposa monarca', 'Danaus plexippus', 6, 1, 1, 1, 2, 1, 1, 'Conocida por su migraci?n masiva de hasta 4,000 km. Sus colores advierten sobre su toxicidad.', '2025-11-24 22:35:28'),
	(13, 'Pulpo com?n', 'Octopus vulgaris', 7, 1, 2, 7, 1, 2, 1, 'Molusco muy inteligente con capacidad de cambiar color y textura para camuflarse.', '2025-11-24 22:35:28'),
	(14, 'Rana dorada venenosa', 'Phyllobates terribilis', 4, 10, 15, 6, 1, 4, 1, 'Uno de los animales m?s venenosos del mundo. Habita en la selva tropical colombiana.', '2025-11-24 22:35:28');

CREATE TABLE IF NOT EXISTS `clasificaciones` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Tipo` enum('Vertebrado','Invertebrado') NOT NULL,
  `Subtipo` varchar(50) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Tipo` (`Tipo`,`Subtipo`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `clasificaciones` (`ID`, `Tipo`, `Subtipo`) VALUES
	(1, 'Vertebrado', 'Mam?fero'),
	(2, 'Vertebrado', 'Ave'),
	(3, 'Vertebrado', 'Reptil'),
	(4, 'Vertebrado', 'Anfibio'),
	(5, 'Vertebrado', 'Pez'),
	(6, 'Invertebrado', 'Artr?podo'),
	(7, 'Invertebrado', 'Molusco'),
	(8, 'Invertebrado', 'An?lido'),
	(9, 'Invertebrado', 'Cnidario'),
	(10, 'Invertebrado', 'Equinodermo');

CREATE TABLE IF NOT EXISTS `climas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Clima` varchar(50) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Clima` (`Clima`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `climas` (`ID`, `Clima`) VALUES
	(1, 'Tropical'),
	(2, 'Templado'),
	(3, 'Des?rtico'),
	(4, 'Polar'),
	(5, 'Mediterr?neo'),
	(6, 'Continental'),
	(7, 'Monta?oso');

CREATE TABLE IF NOT EXISTS `imagenesanimales` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Animal_ID` int(11) NOT NULL,
  `URLImagen` varchar(255) NOT NULL,
  `EsPrincipal` tinyint(1) DEFAULT 0,
  `DescripcionImagen` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Animal_ID` (`Animal_ID`),
  CONSTRAINT `imagenesanimales_ibfk_1` FOREIGN KEY (`Animal_ID`) REFERENCES `animales` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE IF NOT EXISTS `subtiposhabitat` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `TipoHabitat_ID` int(11) NOT NULL,
  `Subtipo` varchar(50) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `TipoHabitat_ID` (`TipoHabitat_ID`,`Subtipo`),
  CONSTRAINT `subtiposhabitat_ibfk_1` FOREIGN KEY (`TipoHabitat_ID`) REFERENCES `tiposhabitat` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `subtiposhabitat` (`ID`, `TipoHabitat_ID`, `Subtipo`) VALUES
	(1, 1, 'Bosque'),
	(2, 1, 'Sabana'),
	(3, 1, 'Desierto'),
	(4, 1, 'Tundra'),
	(5, 1, 'Selva tropical'),
	(6, 1, 'Monta?a'),
	(7, 2, 'Marino - Oc?ano'),
	(8, 2, 'Marino - Costa'),
	(9, 2, 'Agua dulce - R?o'),
	(10, 2, 'Agua dulce - Lago'),
	(11, 2, 'Agua dulce - Pantano'),
	(12, 3, 'Bosque'),
	(13, 3, 'Sabana'),
	(14, 3, 'Selva tropical'),
	(15, 3, 'Monta?a');

CREATE TABLE IF NOT EXISTS `tiposalimentacion` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Tipo` varchar(50) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Tipo` (`Tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tiposalimentacion` (`ID`, `Tipo`) VALUES
	(1, 'Herb?voro'),
	(2, 'Carn?voro'),
	(3, 'Omn?voro'),
	(4, 'Insect?voro'),
	(5, 'Pisc?voro'),
	(6, 'Nectar?voro');

CREATE TABLE IF NOT EXISTS `tiposhabitat` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Tipo` varchar(50) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Tipo` (`Tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tiposhabitat` (`ID`, `Tipo`) VALUES
	(1, 'Terrestre'),
	(2, 'Acu?tico'),
	(3, 'A?reo-terrestre');

CREATE TABLE IF NOT EXISTS `tiposreproduccion` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Tipo` varchar(50) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `Tipo` (`Tipo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `tiposreproduccion` (`ID`, `Tipo`) VALUES
	(1, 'Ov?paro'),
	(2, 'Ovoviv?paro'),
	(3, 'Viv?paro');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
